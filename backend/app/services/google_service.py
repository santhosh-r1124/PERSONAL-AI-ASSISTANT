from __future__ import annotations

import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlencode

import httpx
from sqlalchemy.orm import Session

from ..config import settings
from ..models import User

GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/userinfo.email",
]

# In-memory OAuth state store (use Redis in production)
_oauth_states: dict[str, str] = {}


def is_google_configured() -> bool:
    return bool(settings.google_client_id and settings.google_client_secret)


def get_authorization_url(user_email: str) -> str | None:
    if not is_google_configured():
        return None

    state = secrets.token_urlsafe(32)
    _oauth_states[state] = user_email

    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": " ".join(GOOGLE_SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"


def _exchange_code(code: str) -> dict[str, Any] | None:
    try:
        with httpx.Client() as client:
            resp = client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": settings.google_redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        pass
    return None


def handle_oauth_callback(code: str, state: str, db: Session) -> tuple[bool, str]:
    user_email = _oauth_states.pop(state, None)
    if not user_email:
        return False, "Invalid or expired OAuth state"

    token_data = _exchange_code(code)
    if not token_data:
        return False, "Failed to exchange authorization code"

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        user = User(email=user_email)
        db.add(user)

    user.google_access_token = token_data.get("access_token")
    if token_data.get("refresh_token"):
        user.google_refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in", 3600)
    user.google_token_expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    user.gmail_access_token = user.google_access_token
    db.commit()

    return True, user_email


def _refresh_access_token(user: User, db: Session) -> str | None:
    if not user.google_refresh_token:
        return user.google_access_token

    try:
        with httpx.Client() as client:
            resp = client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "refresh_token": user.google_refresh_token,
                    "grant_type": "refresh_token",
                },
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            user.google_access_token = data["access_token"]
            user.gmail_access_token = user.google_access_token
            expires_in = data.get("expires_in", 3600)
            user.google_token_expiry = datetime.now(timezone.utc) + timedelta(
                seconds=expires_in
            )
            db.commit()
            return user.google_access_token
    except Exception:
        return None


def get_valid_token(user: User, db: Session) -> str | None:
    if not user.google_access_token:
        return None
    if user.google_token_expiry:
        expiry = user.google_token_expiry
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        if expiry < datetime.now(timezone.utc) + timedelta(minutes=5):
            return _refresh_access_token(user, db)
    return user.google_access_token


def get_integration_status(user: User) -> dict[str, Any]:
    connected = bool(user.google_access_token)
    return {
        "google_configured": is_google_configured(),
        "google_connected": connected,
        "gmail_connected": connected,
        "google_calendar_connected": connected,
        "token_expiry": user.google_token_expiry.isoformat()
        if user.google_token_expiry
        else None,
    }


def disconnect_google(user: User, db: Session) -> None:
    user.google_access_token = None
    user.google_refresh_token = None
    user.google_token_expiry = None
    user.gmail_access_token = None
    db.commit()


def _api_get(access_token: str, url: str, params: dict | None = None) -> dict | None:
    try:
        with httpx.Client() as client:
            resp = client.get(
                url,
                params=params,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=30,
            )
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        pass
    return None


def fetch_calendar_events(user: User, db: Session, max_results: int = 20) -> list[dict[str, Any]]:
    token = get_valid_token(user, db)
    if not token:
        return []

    now = datetime.now(timezone.utc)
    time_min = now.isoformat()
    time_max = (now + timedelta(days=30)).isoformat()

    data = _api_get(
        token,
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
            "timeMin": time_min,
            "timeMax": time_max,
            "maxResults": max_results,
            "singleEvents": "true",
            "orderBy": "startTime",
        },
    )
    if not data:
        return []

    events = []
    for item in data.get("items", []):
        start = item.get("start", {})
        end = item.get("end", {})
        events.append(
            {
                "id": item.get("id", ""),
                "title": item.get("summary", "(No title)"),
                "description": item.get("description", ""),
                "start": start.get("dateTime") or start.get("date"),
                "end": end.get("dateTime") or end.get("date"),
                "status": item.get("status", "confirmed"),
                "location": item.get("location", ""),
                "attendees_count": len(item.get("attendees", [])),
                "is_all_day": "date" in start and "dateTime" not in start,
                "has_conflict": False,
                "source": "google_calendar",
            }
        )
    return events


def fetch_gmail_tasks(user: User, db: Session, max_results: int = 15) -> list[dict[str, Any]]:
    token = get_valid_token(user, db)
    if not token:
        return []

    list_data = _api_get(
        token,
        "https://gmail.googleapis.com/gmail/v1/users/me/messages",
        {"maxResults": max_results, "q": "is:unread OR is:important"},
    )
    if not list_data:
        return []

    tasks = []
    for msg_ref in list_data.get("messages", [])[:max_results]:
        msg = _api_get(
            token,
            f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_ref['id']}",
            {"format": "metadata", "metadataHeaders": ["Subject", "From", "Date"]},
        )
        if not msg:
            continue

        headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}
        subject = headers.get("Subject", "(No subject)")
        sender = headers.get("From", "Unknown")

        tasks.append(
            {
                "id": msg_ref["id"],
                "title": f"Reply: {subject}",
                "project": "Gmail",
                "section": sender,
                "priority": 2,
                "due_datetime_utc": None,
                "labels": ["email", "gmail"],
                "source": "gmail",
            }
        )
    return tasks


def create_calendar_event(user: User, db: Session, payload: dict[str, Any]) -> dict[str, Any]:
    token = get_valid_token(user, db)
    if not token:
        return {"status": "error", "message": "Google not connected"}

    event_body = {
        "summary": payload.get("title") or payload.get("summary", "New Event"),
        "description": payload.get("description", ""),
        "start": payload.get("start", {"dateTime": datetime.now(timezone.utc).isoformat()}),
        "end": payload.get("end", {"dateTime": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()}),
    }

    try:
        with httpx.Client() as client:
            resp = client.post(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                content=json.dumps(event_body),
                timeout=30,
            )
            if resp.status_code in (200, 201):
                data = resp.json()
                return {"status": "created", "event_id": data.get("id"), "link": data.get("htmlLink")}
            return {"status": "error", "message": resp.text[:200]}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def send_gmail(user: User, db: Session, payload: dict[str, Any]) -> dict[str, Any]:
    import base64

    token = get_valid_token(user, db)
    if not token:
        return {"status": "error", "message": "Google not connected"}

    to = payload.get("to", "")
    subject = payload.get("subject", "Message from AI Assistant")
    body = payload.get("body", "")

    raw = f"To: {to}\r\nSubject: {subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n{body}"
    encoded = base64.urlsafe_b64encode(raw.encode()).decode()

    try:
        with httpx.Client() as client:
            resp = client.post(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                content=json.dumps({"raw": encoded}),
                timeout=30,
            )
            if resp.status_code == 200:
                return {"status": "sent", "message_id": resp.json().get("id")}
            return {"status": "error", "message": resp.text[:200]}
    except Exception as e:
        return {"status": "error", "message": str(e)}
