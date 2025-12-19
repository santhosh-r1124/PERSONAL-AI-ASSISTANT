"""
Autonomous AI Agent - Automatically extracts tasks from emails/calendar
and manages them without manual intervention.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from sqlalchemy.orm import Session

from .models import Task, User
from .sample_data import calendar_events_for_user, email_tasks_for_user


class AutonomousAgent:
    """
    Autonomous AI agent that automatically:
    1. Extracts tasks from emails and calendar
    2. Creates tasks in database
    3. Manages due dates (today through Jan 1, 2026)
    4. Auto-completes overdue tasks intelligently
    """

    def __init__(self, db: Session, user_id: str):
        self.db = db
        self.user_id = user_id
        self.today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        self.end_date = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)

    def extract_and_create_tasks_from_emails(self, user_email: str) -> dict[str, int]:
        """Automatically extract tasks from emails and create them in DB"""
        email_tasks = email_tasks_for_user(user_email)
        created = 0
        skipped = 0
        
        for et in email_tasks:
            # Filter: Only tasks with due dates from today through Jan 1, 2026
            if et.due_datetime_utc:
                if et.due_datetime_utc < self.today or et.due_datetime_utc > self.end_date:
                    skipped += 1
                    continue
            
            # Check if task already exists
            existing = (
                self.db.query(Task)
                .filter(
                    Task.user_id == self.user_id,
                    Task.source == "email_auto",
                    Task.source_ref == et.task_id
                )
                .first()
            )
            
            if existing:
                continue
            
            # Adjust due date if it's in the past (set to today)
            due_date = et.due_datetime_utc
            if due_date and due_date < self.today:
                due_date = self.today + timedelta(hours=9)  # Set to 9 AM today
            
            # If no due date, set to a reasonable future date (within range)
            if not due_date:
                due_date = self.today + timedelta(days=7)
                if due_date > self.end_date:
                    due_date = self.end_date - timedelta(hours=1)
            
            # Create task
            task = Task(
                user_id=self.user_id,
                title=et.content,
                priority=et.priority,
                due_datetime_utc=due_date,
                source="email_auto",
                source_ref=et.task_id,
                status="open",
            )
            self.db.add(task)
            created += 1
        
        self.db.commit()
        return {"created": created, "skipped": skipped}

    def extract_and_create_tasks_from_calendar(self, user_email: str) -> dict[str, int]:
        """Extract follow-up tasks from calendar events"""
        events = calendar_events_for_user(user_email)
        created = 0
        
        for event in events:
            # Skip if event is too far in the future
            if event.start_datetime_utc > self.end_date:
                continue
            
            # Create follow-up task for meetings (24 hours after end)
            follow_up_due = event.end_datetime_utc + timedelta(hours=24)
            
            # Only create if due date is within range
            if follow_up_due > self.end_date:
                continue
            
            # Check if task already exists
            existing = (
                self.db.query(Task)
                .filter(
                    Task.user_id == self.user_id,
                    Task.source == "calendar_auto",
                    Task.source_ref == event.event_id
                )
                .first()
            )
            
            if existing:
                continue
            
            # Skip generic events
            summary_lower = event.summary.lower()
            if any(skip in summary_lower for skip in ["deep work", "focus", "break", "lunch", "personal"]):
                continue
            
            task = Task(
                user_id=self.user_id,
                title=f"Follow up: {event.summary}",
                description=f"Meeting ended {event.end_datetime_utc.strftime('%Y-%m-%d %H:%M')}",
                priority=2 if event.attendees_count > 2 else 3,
                due_datetime_utc=follow_up_due,
                source="calendar_auto",
                source_ref=event.event_id,
                status="open",
            )
            self.db.add(task)
            created += 1
        
        self.db.commit()
        return {"created": created}

    def auto_complete_overdue_tasks(self) -> int:
        """Intelligently auto-complete tasks that are overdue"""
        # Get tasks overdue by more than 7 days
        cutoff = self.today - timedelta(days=7)
        
        overdue_tasks = (
            self.db.query(Task)
            .filter(
                Task.user_id == self.user_id,
                Task.status == "open",
                Task.due_datetime_utc < cutoff
            )
            .all()
        )
        
        completed = 0
        for task in overdue_tasks:
            task.status = "completed"
            completed += 1
        
        self.db.commit()
        return completed

    def run_autonomous_cycle(self, user_email: str) -> dict[str, Any]:
        """
        Main autonomous cycle - runs automatically to extract and manage tasks
        """
        results = {
            "tasks_created_email": 0,
            "tasks_created_calendar": 0,
            "tasks_completed": 0,
            "tasks_skipped": 0,
        }
        
        # Step 1: Extract tasks from emails
        email_results = self.extract_and_create_tasks_from_emails(user_email)
        results["tasks_created_email"] = email_results["created"]
        results["tasks_skipped"] = email_results["skipped"]
        
        # Step 2: Extract tasks from calendar
        calendar_results = self.extract_and_create_tasks_from_calendar(user_email)
        results["tasks_created_calendar"] = calendar_results["created"]
        
        # Step 3: Auto-complete overdue tasks
        results["tasks_completed"] = self.auto_complete_overdue_tasks()
        
        return results


def run_autonomous_agent_for_user(db: Session, user_email: str) -> dict[str, Any]:
    """Helper function to run autonomous agent for a user"""
    from .main import get_or_create_user
    user = get_or_create_user(db, user_email)
    agent = AutonomousAgent(db=db, user_id=user.id)
    return agent.run_autonomous_cycle(user_email)

