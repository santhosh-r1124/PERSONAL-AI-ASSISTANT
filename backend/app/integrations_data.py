"""Unified data layer: live Google APIs when connected, sample CSV fallback."""

from __future__ import annotations

from sqlalchemy.orm import Session

from .models import User
from .sample_data import (
    CalendarEvent,
    EmailTask,
    calendar_events_for_user as sample_calendar,
    email_tasks_for_user as sample_email,
)
from .services import google_service


def _get_user(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def calendar_events_for_user(
    user_email: str, db: Session | None = None
) -> list[CalendarEvent]:
    if db:
        user = _get_user(db, user_email)
        if user and user.google_access_token:
            live = google_service.fetch_calendar_events(user, db)
            if live:
                events = []
                for e in live:
                    from datetime import datetime

                    def _parse(val: str | None):
                        if not val:
                            return None
                        try:
                            return datetime.fromisoformat(val.replace("Z", "+00:00"))
                        except ValueError:
                            return None

                    start = _parse(e.get("start"))
                    end = _parse(e.get("end"))
                    if not start or not end:
                        continue
                    events.append(
                        CalendarEvent(
                            event_id=e["id"],
                            user_id=user_email,
                            summary=e["title"],
                            description=e.get("description", ""),
                            start_datetime_utc=start,
                            end_datetime_utc=end,
                            status=e.get("status", "confirmed"),
                            attendees_count=e.get("attendees_count", 0),
                            is_all_day=e.get("is_all_day", False),
                            location=e.get("location", ""),
                        )
                    )
                return events
    return sample_calendar(user_email)


def email_tasks_for_user(user_email: str, db: Session | None = None) -> list[EmailTask]:
    if db:
        user = _get_user(db, user_email)
        if user and user.google_access_token:
            live = google_service.fetch_gmail_tasks(user, db)
            if live:
                tasks = []
                for t in live:
                    tasks.append(
                        EmailTask(
                            task_id=t["id"],
                            user_id=user_email,
                            content=t["title"],
                            project=t.get("project", "Gmail"),
                            section=t.get("section", ""),
                            priority=t.get("priority", 2),
                            due_datetime_utc=None,
                            labels=t.get("labels", ["email"]),
                        )
                    )
                return tasks
    return sample_email(user_email)
