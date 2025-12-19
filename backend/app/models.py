import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Boolean,
    Integer,
    ForeignKey,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    google_access_token: Mapped[str | None] = mapped_column(String, nullable=True)
    google_refresh_token: Mapped[str | None] = mapped_column(String, nullable=True)
    google_token_expiry: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    gmail_access_token: Mapped[str | None] = mapped_column(String, nullable=True)

    notion_access_token: Mapped[str | None] = mapped_column(String, nullable=True)
    todoist_access_token: Mapped[str | None] = mapped_column(String, nullable=True)

    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="user")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)

    source: Mapped[str] = mapped_column(
        String, index=True
    )  # internal|gmail|todoist|notion|calendar
    source_ref: Mapped[str | None] = mapped_column(String, nullable=True)

    title: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    priority: Mapped[int] = mapped_column(Integer, default=1)  # 1-4
    status: Mapped[str] = mapped_column(
        String, default="open"
    )  # open|scheduled|completed|missed

    due_datetime_utc: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    scheduled_start_utc: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    scheduled_end_utc: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    estimated_duration_minutes: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user: Mapped[User] = relationship("User", back_populates="tasks")
    reminders: Mapped[list["Reminder"]] = relationship(
        "Reminder", back_populates="task"
    )


class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    task_id: Mapped[str] = mapped_column(String, ForeignKey("tasks.id"), index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)

    remind_at_utc: Mapped[datetime] = mapped_column(DateTime, index=True)
    channel: Mapped[str] = mapped_column(
        String, default="email"
    )  # email|push|ui_notification
    sent: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    task: Mapped[Task] = relationship("Task", back_populates="reminders")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String, index=True)

    action_type: Mapped[str] = mapped_column(
        String
    )  # tool_call|plan|schedule|oauth|error
    tool_name: Mapped[str | None] = mapped_column(String, nullable=True)
    request_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    response_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


