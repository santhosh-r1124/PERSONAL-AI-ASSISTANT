from __future__ import annotations

import json
import re
from typing import Any

from ..config import settings

_client = None


def _get_client():
    global _client
    if _client is not None:
        return _client
    if not settings.gemini_api_key:
        return None
    try:
        from google import genai

        _client = genai.Client(api_key=settings.gemini_api_key)
        return _client
    except Exception:
        return None


def is_available() -> bool:
    return bool(settings.gemini_api_key) and _get_client() is not None


def _extract_json(text: str) -> dict[str, Any] | None:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            return None
    return None


def parse_intent(text: str) -> dict[str, Any] | None:
    client = _get_client()
    if not client:
        return None

    prompt = f"""Classify this user message for a personal task assistant.
Return ONLY valid JSON with keys: intent, title, priority.
intent must be one of: create_task, reschedule_tasks, email_to_task, missed_task_followup, general_query, check_calendar, check_email
title: extracted task title if create_task, else empty string
priority: 1-4 integer, default 2

User message: {text}"""

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
        )
        parsed = _extract_json(response.text or "")
        if parsed and parsed.get("intent"):
            return parsed
    except Exception:
        pass
    return None


def generate_chat_response(
    user_message: str,
    intent: str,
    tool_results: list[dict[str, Any]],
    context: dict[str, Any] | None = None,
) -> str | None:
    client = _get_client()
    if not client:
        return None

    context = context or {}
    integrations = context.get("integrations", {})
    calendar_count = context.get("calendar_events_count", 0)
    email_count = context.get("email_tasks_count", 0)

    system = f"""You are a helpful personal AI assistant with voice and task automation capabilities.
You help users manage tasks, calendar, and email.
Current integrations: Google Calendar={'connected' if integrations.get('google_calendar') else 'not connected'}, Gmail={'connected' if integrations.get('gmail') else 'not connected'}
Calendar events available: {calendar_count}, Email tasks available: {email_count}
Intent detected: {intent}
Tool results: {json.dumps(tool_results, default=str)[:2000]}
Respond concisely in markdown. Be friendly and actionable. If integrations are not connected, mention they can connect Google in Settings."""

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=f"{system}\n\nUser: {user_message}",
        )
        return (response.text or "").strip() or None
    except Exception:
        return None


def transcribe_audio(audio_bytes: bytes, mime_type: str = "audio/webm") -> str | None:
    """Transcribe audio using Gemini multimodal."""
    client = _get_client()
    if not client:
        return None

    try:
        from google.genai import types

        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
                        types.Part.from_text(
                            text="Transcribe this audio exactly. Return only the spoken words, no commentary."
                        ),
                    ],
                )
            ],
        )
        return (response.text or "").strip() or None
    except Exception:
        return None


def voice_response(user_message: str, context: dict[str, Any] | None = None) -> str | None:
    """Short spoken-style response for voice mode."""
    client = _get_client()
    if not client:
        return None

    context = context or {}
    prompt = f"""You are a voice assistant. Respond in 1-3 short sentences, conversational tone, no markdown.
User said: {user_message}
Context: {json.dumps(context, default=str)[:500]}"""

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
        )
        return (response.text or "").strip() or None
    except Exception:
        return None
