from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .db import Base, engine, get_db
from .models import User, Task
from .agent import agent_orchestrator
from .sample_data import calendar_events_for_user, email_tasks_for_user
from .autonomous_agent import run_autonomous_agent_for_user


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


def get_or_create_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user
    user = User(email=email)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


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
def get_calendar_events(user_email: str):
    events = calendar_events_for_user(user_email)
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
def get_email_tasks(user_email: str):
    tasks = email_tasks_for_user(user_email)
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



