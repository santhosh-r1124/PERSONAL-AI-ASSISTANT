from typing import Literal
from pydantic import BaseModel
from datetime import datetime


IntentType = Literal[
    "create_task",
    "schedule_task",
    "reschedule_tasks",
    "email_to_task",
    "missed_task_followup",
    "general_query",
]


class ParsedIntent(BaseModel):
    intent: IntentType
    text: str
    deadline: datetime | None = None
    priority: int | None = None
    context: dict | None = None


class IntentService:
    """
    Lightweight rule-based + LLM-extendable intent extraction.
    In production, you can plug in a classifier here.
    """

    def parse(self, text: str) -> ParsedIntent:
        from .services import gemini_service

        if gemini_service.is_available():
            llm_result = gemini_service.parse_intent(text)
            if llm_result:
                intent = llm_result.get("intent", "general_query")
                valid_intents = {
                    "create_task", "schedule_task", "reschedule_tasks",
                    "email_to_task", "missed_task_followup", "general_query",
                    "check_calendar", "check_email",
                }
                if intent not in valid_intents:
                    intent = "general_query"
                title = llm_result.get("title") or text
                priority = llm_result.get("priority")
                if intent == "check_calendar":
                    intent = "general_query"
                if intent == "check_email":
                    intent = "email_to_task"
                return ParsedIntent(
                    intent=intent,  # type: ignore[arg-type]
                    text=title if intent == "create_task" else text,
                    priority=int(priority) if priority else None,
                )

        lowered = text.lower()

        if "reschedule" in lowered or "move" in lowered or "shift" in lowered:
            return ParsedIntent(intent="reschedule_tasks", text=text)
        if (
            "remind me" in lowered 
            or "create task" in lowered 
            or "create a task" in lowered
            or "add task" in lowered
            or "new task" in lowered
            or "todo" in lowered
            or "task to" in lowered
            or "task:" in lowered
            or lowered.startswith("task")
        ):
            return ParsedIntent(intent="create_task", text=text)
        if "missed" in lowered or "didn't" in lowered or "forgot" in lowered:
            return ParsedIntent(intent="missed_task_followup", text=text)
        if "email" in lowered and ("task" in lowered or "todo" in lowered):
            return ParsedIntent(intent="email_to_task", text=text)

        # Default to create_task if it seems like a task request
        if any(word in lowered for word in ["do", "finish", "complete", "work on", "reply to"]):
            return ParsedIntent(intent="create_task", text=text)

        return ParsedIntent(intent="general_query", text=text)


intent_service = IntentService()


