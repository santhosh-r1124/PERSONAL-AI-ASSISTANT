from __future__ import annotations

from typing import Any
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .intent import ParsedIntent, intent_service
from .models import Task, AuditLog, User
from .services import google_service


class ToolCall(BaseModel):
    name: str
    args: dict[str, Any]


class AgentPlanStep(BaseModel):
    description: str
    tool_calls: list[ToolCall] = []


class AgentPlan(BaseModel):
    intent: ParsedIntent
    steps: list[AgentPlanStep]


class ToolRouter:
    """
    Central place to invoke external/internal tools with guardrails.
    In this skeleton, we only implement internal DB + basic stubs
    for Google Calendar, Gmail, Notion, and Todoist.
    """

    def __init__(self, db: Session, user_id: str):
        self.db = db
        self.user_id = user_id

    # --- Internal tools ---

    def create_task(self, title: str, description: str | None = None, priority: int = 1):
        task = Task(
            user_id=self.user_id,
            title=title,
            description=description,
            priority=priority,
            source="internal",
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def list_open_tasks(self) -> list[Task]:
        return (
            self.db.query(Task)
            .filter(Task.user_id == self.user_id, Task.status == "open")
            .all()
        )

    # --- External tools (stubs) ---

    def google_calendar_create_event(self, payload: dict[str, Any]) -> dict[str, Any]:
        user = self.db.query(User).filter(User.id == self.user_id).first()
        if user and user.google_access_token:
            return google_service.create_calendar_event(user, self.db, payload)
        return {"status": "simulated", "service": "google_calendar", "payload": payload}

    def gmail_send_email(self, payload: dict[str, Any]) -> dict[str, Any]:
        user = self.db.query(User).filter(User.id == self.user_id).first()
        if user and user.google_access_token:
            return google_service.send_gmail(user, self.db, payload)
        return {"status": "simulated", "service": "gmail", "payload": payload}

    def notion_create_page(self, payload: dict[str, Any]) -> dict[str, Any]:
        return {"status": "simulated", "service": "notion", "payload": payload}

    def todoist_create_task(self, payload: dict[str, Any]) -> dict[str, Any]:
        return {"status": "simulated", "service": "todoist", "payload": payload}


class AgentOrchestrator:
    """
    High-level coordinator that:
    - parses intent
    - builds a plan (LLM-ready, currently heuristic)
    - executes tools via ToolRouter
    - logs actions
    """

    def build_plan(self, text: str) -> AgentPlan:
        parsed = intent_service.parse(text)

        steps: list[AgentPlanStep] = []

        if parsed.intent == "create_task":
            steps.append(
                AgentPlanStep(
                    description="Create a task in the internal Task DB.",
                    tool_calls=[
                        ToolCall(
                            name="create_task",
                            args={"title": parsed.text, "priority": parsed.priority or 1},
                        )
                    ],
                )
            )
        elif parsed.intent == "reschedule_tasks":
            steps.append(
                AgentPlanStep(
                    description="Reschedule open tasks based on new time window.",
                    tool_calls=[
                        ToolCall(name="list_open_tasks", args={}),
                    ],
                )
            )
        elif parsed.intent == "email_to_task":
            steps.append(
                AgentPlanStep(
                    description="Extract tasks from recent emails and save as internal tasks.",
                    tool_calls=[
                        ToolCall(
                            name="gmail_fetch_and_extract_tasks",
                            args={"window_hours": 24},
                        )
                    ],
                )
            )
        elif parsed.intent == "missed_task_followup":
            steps.append(
                AgentPlanStep(
                    description="Find missed tasks and propose new times.",
                    tool_calls=[
                        ToolCall(name="list_open_tasks", args={}),
                    ],
                )
            )
        else:
            steps.append(
                AgentPlanStep(
                    description="Answer general query (no tools required).",
                    tool_calls=[],
                )
            )

        return AgentPlan(intent=parsed, steps=steps)

    def execute_plan(
        self, db: Session, user_id: str, plan: AgentPlan
    ) -> list[dict[str, Any]]:
        router = ToolRouter(db=db, user_id=user_id)
        results: list[dict[str, Any]] = []

        for step in plan.steps:
            for call in step.tool_calls:
                if call.name == "create_task":
                    task = router.create_task(**call.args)
                    results.append({"tool": call.name, "result": {"task_id": task.id}})
                elif call.name == "list_open_tasks":
                    tasks = router.list_open_tasks()
                    results.append(
                        {
                            "tool": call.name,
                            "result": [
                                {"id": t.id, "title": t.title, "status": t.status}
                                for t in tasks
                            ],
                        }
                    )
                elif call.name == "gmail_fetch_and_extract_tasks":
                    from .integrations_data import email_tasks_for_user
                    from .models import User as UserModel

                    user = db.query(UserModel).filter(UserModel.id == user_id).first()
                    email = user.email if user else ""
                    emails = email_tasks_for_user(email, db)
                    created = []
                    for et in emails[:5]:
                        task = router.create_task(
                            title=et.content,
                            description=f"From email ({et.section})",
                            priority=et.priority,
                        )
                        task.source = "gmail"
                        task.source_ref = et.task_id
                        db.commit()
                        created.append({"task_id": task.id, "title": task.title})
                    results.append(
                        {
                            "tool": call.name,
                            "result": {
                                "status": "ok",
                                "emails_found": len(emails),
                                "tasks_created": created,
                            },
                        }
                    )
                elif call.name == "google_calendar_create_event":
                    result = router.google_calendar_create_event(call.args)
                    results.append({"tool": call.name, "result": result})
                elif call.name == "gmail_send_email":
                    result = router.gmail_send_email(call.args)
                    results.append({"tool": call.name, "result": result})
                else:
                    results.append(
                        {
                            "tool": call.name,
                            "error": "Unknown tool (not yet implemented).",
                        }
                    )

        # Simple audit log
        db.add(
            AuditLog(
                user_id=user_id,
                action_type="plan",
                tool_name=None,
                request_payload={"plan": plan.model_dump()},
                response_payload={"results": results},
            )
        )
        db.commit()

        return results


agent_orchestrator = AgentOrchestrator()


