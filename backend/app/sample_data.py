from __future__ import annotations

import csv
from dataclasses import dataclass
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import List


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"


def _parse_ts(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


@dataclass
class CalendarEvent:
    event_id: str
    user_id: str
    summary: str
    description: str
    start_datetime_utc: datetime
    end_datetime_utc: datetime
    status: str
    attendees_count: int
    is_all_day: bool
    location: str
    has_conflict: bool = False


@dataclass
class EmailTask:
    task_id: str
    user_id: str
    content: str
    project: str
    section: str
    priority: int
    due_datetime_utc: datetime | None
    labels: list[str]


@lru_cache
def load_calendar_events() -> List[CalendarEvent]:
    events: list[CalendarEvent] = []
    path = DATA_DIR / "google_calendar_sample.csv"
    if not path.exists():
        return events

    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            start = _parse_ts(row.get("start_datetime_utc"))
            end = _parse_ts(row.get("end_datetime_utc"))
            if not start or not end:
                continue
            events.append(
                CalendarEvent(
                    event_id=row.get("event_id") or "",
                    user_id=row.get("user_id") or "",
                    summary=row.get("summary") or "",
                    description=row.get("description") or "",
                    start_datetime_utc=start,
                    end_datetime_utc=end,
                    status=row.get("status") or "confirmed",
                    attendees_count=int(row.get("attendees_count") or 0),
                    is_all_day=row.get("is_all_day", "false").lower() == "true",
                    location=row.get("location") or "",
                )
            )

    # compute conflicts per user
    by_user: dict[str, list[CalendarEvent]] = {}
    for ev in events:
        by_user.setdefault(ev.user_id, []).append(ev)

    for user_events in by_user.values():
        user_events.sort(key=lambda e: e.start_datetime_utc)
        for i in range(1, len(user_events)):
            prev = user_events[i - 1]
            curr = user_events[i]
            if prev.end_datetime_utc > curr.start_datetime_utc:
                prev.has_conflict = True
                curr.has_conflict = True

    return events


@lru_cache
def load_email_tasks() -> List[EmailTask]:
    tasks: list[EmailTask] = []
    path = DATA_DIR / "todoist_tasks_sample.csv"
    if not path.exists():
        return tasks

    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            labels_raw = (row.get("labels") or "").strip()
            labels = [p.strip() for p in labels_raw.split(";") if p.strip()]

            # treat tasks with an "email" label or email-like content as email-derived
            lower_content = (row.get("content") or "").lower()
            if "email" not in lower_content and "email" not in [l.lower() for l in labels]:
                continue

            tasks.append(
                EmailTask(
                    task_id=row.get("task_id") or "",
                    user_id=row.get("user_id") or "",
                    content=row.get("content") or "",
                    project=row.get("project") or "",
                    section=row.get("section") or "",
                    priority=int(row.get("priority") or 1),
                    due_datetime_utc=_parse_ts(row.get("due_datetime_utc")),
                    labels=labels,
                )
            )

    return tasks


def calendar_events_for_user(user_external_id: str) -> list[CalendarEvent]:
    # for this working model, we map all users to user_123
    target_user_id = "user_123"
    from datetime import datetime, timezone
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    
    all_events = [e for e in load_calendar_events() if e.user_id == target_user_id]
    # Filter events from today through January 1, 2026
    filtered_events = [
        e for e in all_events 
        if e.start_datetime_utc >= today and e.start_datetime_utc <= end_date
    ]
    return filtered_events


def email_tasks_for_user(user_external_id: str) -> list[EmailTask]:
    target_user_id = "user_123"
    from datetime import datetime, timezone
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    
    all_tasks = [t for t in load_email_tasks() if t.user_id == target_user_id]
    # Filter tasks with due dates from today through Jan 1, 2026
    filtered = []
    for t in all_tasks:
        if t.due_datetime_utc:
            if today <= t.due_datetime_utc <= end_date:
                filtered.append(t)
        else:
            # Include tasks without due dates (they'll be assigned dates by agent)
            filtered.append(t)
    return filtered



