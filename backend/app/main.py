import uuid
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Any

from .config import settings
from .db import Base, engine, get_db
from .models import User, Task
from .agent import agent_orchestrator
from .integrations_data import calendar_events_for_user, email_tasks_for_user
from .autonomous_agent import run_autonomous_agent_for_user
from .services import gemini_service, google_service


Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Personal Task Automation Agent", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CommandRequest(BaseModel):
    user_email: str
    text: str


class CommandResponse(BaseModel):
    intent: str
    steps: list[dict]
    results: list[dict]


class ChatRequest(BaseModel):
    user_email: str
    message: str
    conversation_id: str | None = None


class ChatResponse(BaseModel):
    response: str
    intent: str
    conversation_id: str
    metadata: dict[str, Any] = {}


class CreateTaskRequest(BaseModel):
    user_email: str
    title: str
    description: str | None = None
    priority: int = 1
    due_datetime_utc: str | None = None


class UpdateTaskRequest(BaseModel):
    status: str | None = None
    priority: int | None = None
    title: str | None = None
    description: str | None = None


class VoiceChatRequest(BaseModel):
    user_email: str
    message: str | None = None
    conversation_id: str | None = None
    voice_mode: bool = True


class VoiceChatResponse(BaseModel):
    transcript: str
    response: str
    spoken_response: str
    intent: str
    conversation_id: str


def get_or_create_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user
    user = User(email=email)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _format_chat_response(intent: str, text: str, results: list[dict]) -> str:
    """Convert structured agent results into a human-readable markdown response."""

    if intent == "create_task":
        task_ids = [r["result"]["task_id"] for r in results if r.get("result", {}).get("task_id")]
        if task_ids:
            # Extract task title from the input text (best effort)
            title = text.strip()
            for prefix in ["create task", "create a task", "add task", "new task", "remind me to", "remind me", "task:", "todo:"]:
                if title.lower().startswith(prefix):
                    title = title[len(prefix):].strip()
                    break
            return (
                f"✅ **Task created successfully!**\n\n"
                f"I've added **\"{title}\"** to your task list. "
                f"You can view and manage it in the active tasks section.\n\n"
                f"*Task ID: `{task_ids[0][:8]}...`*"
            )
        return "✅ I've processed your task creation request."

    elif intent == "reschedule_tasks":
        task_results = next((r["result"] for r in results if r.get("tool") == "list_open_tasks"), [])
        count = len(task_results) if isinstance(task_results, list) else 0
        if count == 0:
            return "📋 **No open tasks found** to reschedule. You're all caught up!"
        task_lines = "\n".join(
            f"- **{t['title']}** (`{t['status']}`)"
            for t in (task_results[:5] if isinstance(task_results, list) else [])
        )
        suffix = f"\n*...and {count - 5} more*" if count > 5 else ""
        return (
            f"🔄 **Found {count} open task{'s' if count != 1 else ''} to reschedule:**\n\n"
            f"{task_lines}{suffix}\n\n"
            f"To reschedule, please specify the new date/time (e.g., \"reschedule to tomorrow 9am\")."
        )

    elif intent == "missed_task_followup":
        task_results = next((r["result"] for r in results if r.get("tool") == "list_open_tasks"), [])
        count = len(task_results) if isinstance(task_results, list) else 0
        if count == 0:
            return "✨ **Great news!** No missed or overdue tasks found. You're on track!"
        task_lines = "\n".join(
            f"- **{t['title']}**"
            for t in (task_results[:5] if isinstance(task_results, list) else [])
        )
        return (
            f"⚠️ **Found {count} task{'s' if count != 1 else ''} that may need follow-up:**\n\n"
            f"{task_lines}\n\n"
            f"Would you like me to reschedule these or mark them as completed?"
        )

    elif intent == "email_to_task":
        return (
            f"📧 **Email task extraction initiated!**\n\n"
            f"I would scan your recent emails and automatically extract action items, "
            f"deadlines, and follow-ups as tasks.\n\n"
            f"> *In production mode, this connects to your Gmail inbox via OAuth. "
            f"Currently running in demo mode with sample email data.*\n\n"
            f"You can view extracted tasks in the **Active Tasks** section."
        )

    else:  # general_query
        lowered = text.lower()
        if any(w in lowered for w in ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"]):
            return (
                "👋 **Hello! I'm your Personal AI Assistant.**\n\n"
                "Here's what I can help you with:\n"
                "- 📝 **Create tasks** — *\"Create a task to review the Q3 report\"*\n"
                "- 📅 **View your schedule** — *\"Show my calendar\"*\n"
                "- 📧 **Extract email tasks** — *\"Pull tasks from my emails\"*\n"
                "- 🔄 **Reschedule tasks** — *\"Move my tasks to next week\"*\n"
                "- 🤖 **Run autonomous agent** — *\"Run the autonomous agent\"*\n\n"
                "What would you like to do today?"
            )
        if any(w in lowered for w in ["task", "tasks", "show", "list", "what"]):
            return (
                f"🤔 I understood your query: **\"{text}\"**\n\n"
                f"To get your tasks, try saying:\n"
                f"- *\"Show my open tasks\"*\n"
                f"- *\"List all my tasks\"*\n\n"
                f"Or to create a task: *\"Create a task to {text.lower()}\"*"
            )
        return (
            f"🤖 I received your message: **\"{text}\"**\n\n"
            f"I'm a task automation assistant. Here's what I can help with:\n"
            f"- **Create & manage tasks** with natural language\n"
            f"- **Sync with your calendar** and email inbox\n"
            f"- **Autonomous task extraction** from emails and meetings\n\n"
            f"Try: *\"Create a task to {text[:40]}{'...' if len(text) > 40 else ''}\"*"
        )


def _build_chat_context(user: User, db: Session) -> dict[str, Any]:
    integration_status = google_service.get_integration_status(user)
    cal_events = calendar_events_for_user(user.email, db)
    email_tasks = email_tasks_for_user(user.email, db)
    return {
        "integrations": integration_status,
        "calendar_events_count": len(cal_events),
        "email_tasks_count": len(email_tasks),
    }


@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(payload: ChatRequest, db: Session = Depends(get_db)):
    """Chat endpoint — Gemini-powered when API key is set, falls back to templates."""
    user = get_or_create_user(db, payload.user_email)
    plan = agent_orchestrator.build_plan(payload.message)
    results = agent_orchestrator.execute_plan(db, user.id, plan)

    context = _build_chat_context(user, db)
    response_text = gemini_service.generate_chat_response(
        payload.message, plan.intent.intent, results, context
    )
    if not response_text:
        response_text = _format_chat_response(plan.intent.intent, payload.message, results)

    conversation_id = payload.conversation_id or str(uuid.uuid4())

    return ChatResponse(
        response=response_text,
        intent=plan.intent.intent,
        conversation_id=conversation_id,
        metadata={
            "steps_count": len(plan.steps),
            "results_count": len(results),
            "tools_used": [tc.name for step in plan.steps for tc in step.tool_calls],
            "gemini_enabled": gemini_service.is_available(),
            "integrations": context["integrations"],
        },
    )


@app.post("/api/voice/chat", response_model=VoiceChatResponse)
async def voice_chat_endpoint(
    user_email: str = Form(...),
    message: str | None = Form(None),
    conversation_id: str | None = Form(None),
    audio: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    """Voice chat: accepts text or audio, returns spoken-style Gemini response."""
    user = get_or_create_user(db, user_email)
    transcript = (message or "").strip()

    if audio and not transcript:
        audio_bytes = await audio.read()
        mime = audio.content_type or "audio/webm"
        transcribed = gemini_service.transcribe_audio(audio_bytes, mime)
        if transcribed:
            transcript = transcribed

    if not transcript:
        raise HTTPException(status_code=400, detail="No speech detected. Please try again.")

    plan = agent_orchestrator.build_plan(transcript)
    results = agent_orchestrator.execute_plan(db, user.id, plan)
    context = _build_chat_context(user, db)

    spoken = gemini_service.voice_response(transcript, {**context, "intent": plan.intent.intent})
    if not spoken:
        spoken = _format_chat_response(plan.intent.intent, transcript, results)
        spoken = spoken.replace("**", "").replace("*", "").replace("`", "")

    full_response = gemini_service.generate_chat_response(
        transcript, plan.intent.intent, results, context
    )
    if not full_response:
        full_response = _format_chat_response(plan.intent.intent, transcript, results)

    conv_id = conversation_id or str(uuid.uuid4())
    return VoiceChatResponse(
        transcript=transcript,
        response=full_response,
        spoken_response=spoken,
        intent=plan.intent.intent,
        conversation_id=conv_id,
    )


@app.post("/api/voice/transcribe")
async def voice_transcribe_endpoint(
    audio: UploadFile = File(...),
    user_email: str = Form(""),
):
    """Transcribe audio blob to text using Gemini."""
    if not gemini_service.is_available():
        raise HTTPException(status_code=503, detail="Gemini API key not configured")

    audio_bytes = await audio.read()
    mime = audio.content_type or "audio/webm"
    text = gemini_service.transcribe_audio(audio_bytes, mime)
    if not text:
        raise HTTPException(status_code=422, detail="Could not transcribe audio")
    return {"transcript": text, "user_email": user_email}


@app.get("/api/voice/status")
def voice_status():
    return {
        "gemini_available": gemini_service.is_available(),
        "gemini_model": settings.gemini_model,
        "voice_enabled": gemini_service.is_available(),
    }


@app.get("/api/integrations/status")
def integrations_status(user_email: str, db: Session = Depends(get_db)):
    user = get_or_create_user(db, user_email)
    status = google_service.get_integration_status(user)
    status["gemini_connected"] = gemini_service.is_available()
    status["gemini_model"] = settings.gemini_model
    return status


@app.get("/api/oauth/google/authorize")
def google_oauth_authorize(user_email: str):
    url = google_service.get_authorization_url(user_email)
    if not url:
        raise HTTPException(
            status_code=503,
            detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env",
        )
    return {"authorization_url": url}


@app.get("/api/oauth/google/callback")
def google_oauth_callback(code: str, state: str, db: Session = Depends(get_db)):
    success, result = google_service.handle_oauth_callback(code, state, db)
    if success:
        return RedirectResponse(
            url=f"{settings.frontend_url}?oauth=google_success&email={result}"
        )
    return RedirectResponse(url=f"{settings.frontend_url}?oauth=google_error&message={result}")


@app.post("/api/integrations/google/disconnect")
def google_disconnect(user_email: str, db: Session = Depends(get_db)):
    user = get_or_create_user(db, user_email)
    google_service.disconnect_google(user, db)
    return {"status": "disconnected", "service": "google"}


@app.get("/")
def root():
    return {"status": "ok", "message": "AI Personal Task Automation Agent API", "version": "0.1.0"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "AI Task Automation Agent"}


@app.post("/api/agent/command", response_model=CommandResponse)
def agent_command(payload: CommandRequest, db: Session = Depends(get_db)):
    user = get_or_create_user(db, payload.user_email)
    plan = agent_orchestrator.build_plan(payload.text)
    results = agent_orchestrator.execute_plan(db, user.id, plan)
    return CommandResponse(
        intent=plan.intent.intent,
        steps=[s.model_dump() for s in plan.steps],
        results=results,
    )


@app.get("/api/tasks")
def list_tasks(user_email: str, db: Session = Depends(get_db)):
    user = get_or_create_user(db, user_email)
    all_tasks = db.query(Task).filter(Task.user_id == user.id).order_by(Task.created_at.desc()).all()
    
    active_tasks = [t for t in all_tasks if t.status in ["open", "scheduled"]]
    completed_tasks = [t for t in all_tasks if t.status == "completed"]
    
    def task_to_dict(t):
        return {
            "id": t.id,
            "title": t.title,
            "status": t.status,
            "priority": t.priority,
            "source": t.source or "internal",
            "due_datetime_utc": t.due_datetime_utc.isoformat() if t.due_datetime_utc else None,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "completed_at": t.updated_at.isoformat() if t.status == "completed" and t.updated_at else None,
        }
    
    return {
        "active": [task_to_dict(t) for t in active_tasks],
        "completed": [task_to_dict(t) for t in completed_tasks],
        "all": [task_to_dict(t) for t in all_tasks],
    }


@app.get("/api/calendar/events", response_model=list[dict])
def get_calendar_events(user_email: str, db: Session = Depends(get_db)):
    events = calendar_events_for_user(user_email, db)
    return [
        {
            "id": e.event_id,
            "title": e.summary,
            "description": e.description,
            "start": e.start_datetime_utc.isoformat() if e.start_datetime_utc else None,
            "end": e.end_datetime_utc.isoformat() if e.end_datetime_utc else None,
            "status": e.status,
            "location": e.location,
            "attendees_count": e.attendees_count,
            "is_all_day": e.is_all_day,
            "has_conflict": e.has_conflict,
        }
        for e in events
    ]


@app.get("/api/inbox/email-tasks", response_model=list[dict])
def get_email_tasks(user_email: str, db: Session = Depends(get_db)):
    tasks = email_tasks_for_user(user_email, db)
    return [
        {
            "id": t.task_id,
            "title": t.content,
            "project": t.project,
            "section": t.section,
            "priority": t.priority,
            "due_datetime_utc": t.due_datetime_utc,
            "labels": t.labels,
        }
        for t in tasks
    ]


@app.post("/api/tasks/create")
def create_task(payload: CreateTaskRequest, db: Session = Depends(get_db)):
    from datetime import datetime
    user = get_or_create_user(db, payload.user_email)
    
    due_datetime = None
    if payload.due_datetime_utc:
        try:
            due_datetime = datetime.fromisoformat(payload.due_datetime_utc.replace("Z", "+00:00"))
        except:
            pass
    
    task = Task(
        user_id=user.id,
        title=payload.title,
        description=payload.description,
        priority=min(max(payload.priority, 1), 4),  # Clamp between 1-4
        due_datetime_utc=due_datetime,
        status="open",
        source="internal",
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return {
        "id": task.id,
        "title": task.title,
        "status": task.status,
        "priority": task.priority,
        "due_datetime_utc": task.due_datetime_utc.isoformat() if task.due_datetime_utc else None,
        "created_at": task.created_at.isoformat() if task.created_at else None,
    }


@app.patch("/api/tasks/{task_id}")
def update_task(task_id: str, payload: UpdateTaskRequest, user_email: str, db: Session = Depends(get_db)):
    user = get_or_create_user(db, user_email)
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    
    if not task:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Task not found")
    
    if payload.status is not None:
        task.status = payload.status
    if payload.priority is not None:
        task.priority = min(max(payload.priority, 1), 4)
    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    
    db.commit()
    db.refresh(task)
    
    return {
        "id": task.id,
        "title": task.title,
        "status": task.status,
        "priority": task.priority,
        "due_datetime_utc": task.due_datetime_utc.isoformat() if task.due_datetime_utc else None,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "completed_at": task.updated_at.isoformat() if task.status == "completed" and task.updated_at else None,
    }


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str, user_email: str, db: Session = Depends(get_db)):
    user = get_or_create_user(db, user_email)
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    
    if not task:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    
    return {"status": "deleted", "id": task_id}


@app.post("/api/agent/autonomous/run")
def run_autonomous_agent(user_email: str, db: Session = Depends(get_db)):
    """
    Run the autonomous AI agent to automatically:
    - Extract tasks from emails (due dates: today through Jan 1, 2026)
    - Extract follow-up tasks from calendar events
    - Auto-complete overdue tasks
    """
    results = run_autonomous_agent_for_user(db, user_email)
    return {
        "status": "success",
        "message": "Autonomous agent cycle completed",
        "results": results,
    }



