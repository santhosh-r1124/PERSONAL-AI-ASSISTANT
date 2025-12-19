import { useEffect, useState } from "react";
import axios from "axios";
import { getTheme, setTheme, themes, applyTheme } from "./theme";
import Login from "./Login";

const DEFAULT_USER_EMAIL = "demo@example.com";

function Card({ title, children, className = "" }) {
  return (
    <div
      className={`bg-surface rounded-xl border border-outline/40 shadow-lg shadow-black/40 p-4 ${className}`}
    >
      <h2 className="text-sm font-semibold tracking-wide text-foreground mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Pill({ label, tone = "default" }) {
  const tones = {
    default: "bg-chip text-chip",
    success: "bg-success text-white",
    warning: "bg-warning text-white",
    danger: "bg-danger text-white"
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

function TaskList({ tasks, loading, onComplete, onDelete, showActions = true }) {
  if (loading) {
    return (
      <div className="text-muted text-sm flex items-center gap-2">
        <span>⏳</span>
        <span>Loading tasks…</span>
      </div>
    );
  }
  if (!tasks.length) {
    return (
      <div className="text-muted text-sm flex flex-col items-center justify-center py-8">
        <span className="text-4xl mb-2">📝</span>
        <span>No tasks yet.</span>
        <span className="text-xs mt-1">Create a task using the form above!</span>
      </div>
    );
  }
  return (
    <ul className="space-y-2 max-h-72 overflow-auto pr-1">
      {tasks.map((t) => {
        const isAutoCreated = t.source && (t.source.includes("email_auto") || t.source.includes("calendar_auto"));
        return (
          <li
            key={t.id}
            className="flex items-start justify-between rounded-lg bg-elevated/40 px-3 py-2.5 group"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">{t.title}</div>
                {isAutoCreated && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-purple/20 text-neon-purple" title="AI Auto-created">
                    AI
                  </span>
                )}
              </div>
              <div className="text-xs text-muted mt-0.5 capitalize">
                {t.status === "completed" && t.completed_at 
                  ? `Completed ${new Date(t.completed_at).toLocaleDateString()}`
                  : `Status: ${t.status}`}
              </div>
            </div>
          <div className="flex items-center gap-2">
            <Pill
              label={`P${t.priority}`}
              tone={t.priority >= 4 ? "danger" : t.priority === 3 ? "warning" : "default"}
            />
            {showActions && t.status !== "completed" && onComplete && (
              <button
                onClick={() => onComplete(t.id)}
                className="text-xs px-2 py-1 rounded bg-success/20 text-success hover:bg-success/30 transition-colors"
                title="Mark as completed"
              >
                ✓
              </button>
            )}
            {showActions && onDelete && (
              <button
                onClick={() => onDelete(t.id)}
                className="text-xs px-2 py-1 rounded bg-danger/20 text-danger hover:bg-danger/30 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete task"
              >
                ×
              </button>
            )}
          </div>
        </li>
        );
      })}
    </ul>
  );
}

function ActivityLog({ steps, results }) {
  if (!steps.length && !results.length) {
    return (
      <div className="text-muted text-sm flex flex-col items-center justify-center py-8">
        <span className="text-4xl mb-2">🧠</span>
        <span className="text-center">Agent activity will appear here</span>
        <span className="text-xs mt-1 text-center">after you run a command</span>
      </div>
    );
  }
  return (
    <div className="space-y-2 max-h-72 overflow-auto pr-1 text-sm">
      {steps.map((s, idx) => (
        <div key={idx} className="flex gap-2 items-start">
          <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-xs flex items-center justify-center mt-0.5">
            {idx + 1}
          </span>
          <div>
            <div className="font-medium">{s.description}</div>
            {s.tool_calls?.length ? (
              <div className="text-xs text-muted mt-0.5">
                Tools: {s.tool_calls.map((t) => t.name).join(", ")}
              </div>
            ) : null}
          </div>
        </div>
      ))}
      {results.length ? (
        <div className="pt-2 border-t border-outline/30 text-xs text-muted">
          {results.map((r, idx) => {
            let displayResult = "";
            if (r.error) {
              displayResult = r.error;
            } else if (r.result) {
              if (Array.isArray(r.result)) {
                if (r.tool === "list_open_tasks" && r.result.length > 0) {
                  displayResult = `${r.result.length} task(s) found`;
                } else {
                  displayResult = `${r.result.length} item(s)`;
                }
              } else if (typeof r.result === "object") {
                if (r.result.task_id) {
                  displayResult = `Task created: ${r.result.task_id.substring(0, 8)}...`;
                } else if (r.result.status) {
                  displayResult = r.result.status;
                } else {
                  displayResult = "Completed";
                }
              } else {
                displayResult = String(r.result);
              }
            }
            return (
              <div key={idx} className="mt-0.5">
                <span className="font-semibold text-foreground/80">
                  {r.tool}
                </span>
                :{" "}
                <span className="text-[11px]">
                  {displayResult}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function QuickTaskForm({ onSubmit, busy }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || busy) return;
    onSubmit(title.trim(), priority);
    setTitle("");
    setPriority(1);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 bg-elevated/60 border border-outline/50 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-grey-500/50 focus:border-grey-500"
          placeholder="Enter task title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(parseInt(e.target.value))}
          className="bg-elevated/60 border border-outline/50 px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-grey-500/50"
        >
          <option value={1}>P1</option>
          <option value={2}>P2</option>
          <option value={3}>P3</option>
          <option value={4}>P4</option>
        </select>
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="px-4 py-2 rounded-lg bg-grey-700 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
        >
          Add
        </button>
      </div>
    </form>
  );
}

function CommandInput({ onSubmit, busy }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    onSubmit(text.trim());
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm font-medium text-foreground mb-2">
        Natural Language Command
      </label>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <textarea
            rows="4"
            className="w-full bg-elevated/60 border border-outline/50 px-4 py-4 text-base text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-grey-500/50 focus:border-grey-500 resize-none"
            placeholder='e.g. "Reschedule my high-priority tasks to tomorrow morning" or "Create a task to finish the Q3 deck and schedule deep work tomorrow 2–4pm"'
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {text.length > 0 && (
            <span className="pointer-events-none absolute right-3 bottom-3 text-[10px] text-muted">
              {text.length} chars
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="px-6 py-4 rounded-lg bg-grey-700 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-lg self-start"
        >
          {busy ? "🤔 Thinking…" : "✨ Run"}
        </button>
      </div>
      <p className="text-xs text-muted">
        💡 Examples: "Pull tasks from my recent emails", "Create a task to finish the Q3 deck and schedule deep work tomorrow 2–4pm", "Reschedule all my tasks to next week"
      </p>
    </form>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("userEmail") !== null;
  });
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem("userEmail") || DEFAULT_USER_EMAIL;
  });
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem("theme") || "dark";
    return saved;
  });
  const [tasks, setTasks] = useState([]);
  const [activeTasks, setActiveTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [agentBusy, setAgentBusy] = useState(false);
  const [intent, setIntent] = useState(null);
  const [steps, setSteps] = useState([]);
  const [results, setResults] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [emailTasks, setEmailTasks] = useState([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Initialize theme on mount
  useEffect(() => {
    applyTheme(getTheme());
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = (email) => {
    localStorage.setItem("userEmail", email);
    setUserEmail(email);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    setIsLoggedIn(false);
    setUserEmail(DEFAULT_USER_EMAIL);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const handleThemeChange = (themeName) => {
    setCurrentTheme(themeName);
    setTheme(themeName);
    applyTheme(themes[themeName]);
  };

  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const res = await axios.get("/api/tasks", {
        params: { user_email: userEmail }
      });
      // Handle new response format with active, completed, and all
      if (res.data && typeof res.data === 'object' && 'active' in res.data) {
        setActiveTasks(res.data.active || []);
        setCompletedTasks(res.data.completed || []);
        setTasks(res.data.all || []);
      } else {
        // Fallback for old format
        setTasks(res.data || []);
        setActiveTasks(res.data?.filter(t => t.status === "open" || t.status === "scheduled") || []);
        setCompletedTasks(res.data?.filter(t => t.status === "completed") || []);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
      setTasks([]);
      setActiveTasks([]);
      setCompletedTasks([]);
      // Show user-friendly error
      if (err.response) {
        console.error("Backend error:", err.response.status, err.response.data);
        if (err.response.status === 404) {
          setError("Backend endpoint not found. Make sure backend is running at http://localhost:8000");
        }
      } else if (err.request) {
        console.error("No response from backend - is it running?");
        setError("Cannot connect to backend. Make sure it's running at http://localhost:8000");
      } else {
        setError("Failed to fetch tasks: " + err.message);
      }
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchCalendar = async () => {
    if (calendarLoading) return;
    setCalendarLoading(true);
    try {
      const res = await axios.get("/api/calendar/events", {
        params: { user_email: userEmail }
      });
      const events = res.data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date('2026-01-01T00:00:00Z');
      const filtered = events.filter(ev => {
        if (!ev.start) return false;
        const startDate = new Date(ev.start);
        return startDate >= today && startDate <= endDate;
      });
      setCalendarEvents(filtered);
    } catch (err) {
      console.error("Failed to fetch calendar events", err);
      setCalendarEvents([]);
    } finally {
      setCalendarLoading(false);
    }
  };

  const fetchEmailTasks = async () => {
    if (emailLoading) return; // Prevent concurrent fetches
    setEmailLoading(true);
    try {
      const res = await axios.get("/api/inbox/email-tasks", {
        params: { user_email: userEmail }
      });
      setEmailTasks(res.data || []);
    } catch (err) {
      console.error("Failed to fetch email inbox tasks", err);
      setEmailTasks([]);
    } finally {
      setEmailLoading(false);
    }
  };

  const runAutonomousAgent = async () => {
    try {
      const res = await axios.post("/api/agent/autonomous/run", null, {
        params: { user_email: userEmail }
      });
      if (res.data?.results) {
        if (res.data.results.tasks_created_email > 0 || 
            res.data.results.tasks_created_calendar > 0 || 
            res.data.results.tasks_completed > 0) {
          await fetchTasks();
        }
      }
    } catch (err) {
      console.error("Autonomous agent error", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn && userEmail) {
      fetchTasks();
      fetchCalendar();
      fetchEmailTasks();
      // Run autonomous agent on login
      runAutonomousAgent();
    }
  }, [isLoggedIn, userEmail]);

  // Run autonomous agent every 5 minutes
  useEffect(() => {
    if (!isLoggedIn || !userEmail) return;
    const interval = setInterval(() => {
      runAutonomousAgent();
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [isLoggedIn, userEmail]);

  const runCommand = async (text) => {
    setAgentBusy(true);
    setError(null);
    setIntent(null);
    setSteps([]);
    setResults([]);
    try {
      const res = await axios.post("/api/agent/command", {
        user_email: userEmail,
        text
      });
      setIntent(res.data.intent);
      setSteps(res.data.steps ?? []);
      setResults(res.data.results ?? []);
      await fetchTasks();
      await fetchCalendar();
    } catch (err) {
      console.error("Command error", err);
      if (err.response) {
        if (err.response.status === 404) {
          setError("Backend endpoint not found. Check: http://localhost:8000/api/agent/command");
        } else {
          setError(err.response?.data?.detail || `Backend error: ${err.response.status}`);
        }
      } else if (err.request) {
        setError("Cannot connect to backend. Make sure it's running at http://localhost:8000");
      } else {
        setError("Failed to execute command: " + err.message);
      }
    } finally {
      setAgentBusy(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const handleCreateTask = async (title, priority = 1) => {
    try {
      await axios.post("/api/tasks/create", {
        user_email: userEmail,
        title: title.trim(),
        priority: priority,
      });
      await fetchTasks(); // Refresh tasks immediately
    } catch (err) {
      console.error("Failed to create task", err);
      setError("Failed to create task: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await axios.patch(`/api/tasks/${taskId}`, {
        status: "completed"
      }, {
        params: { user_email: userEmail }
      });
      await fetchTasks(); // Refresh tasks immediately
    } catch (err) {
      console.error("Failed to complete task", err);
      setError("Failed to complete task: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(`/api/tasks/${taskId}`, {
        params: { user_email: userEmail }
      });
      await fetchTasks(); // Refresh tasks immediately
    } catch (err) {
      console.error("Failed to delete task", err);
      setError("Failed to delete task: " + (err.response?.data?.detail || err.message));
    }
  };

  const CalendarCard = () => {
    if (calendarLoading) {
      return (
        <div className="text-muted text-sm flex items-center gap-2">
          <span>⏳</span>
          <span>Loading calendar…</span>
        </div>
      );
    }
    if (!calendarEvents.length) {
      return (
        <div className="text-muted text-sm flex flex-col items-center justify-center py-8">
          <span className="text-4xl mb-2">📅</span>
          <span>No calendar events</span>
          <span className="text-xs mt-1">from the sample dataset</span>
        </div>
      );
    }
    const sorted = [...calendarEvents].sort(
      (a, b) => new Date(a.start) - new Date(b.start)
    );
    return (
      <ul className="space-y-2 max-h-72 overflow-auto pr-1 text-sm">
        {sorted.map((ev) => {
          const start = new Date(ev.start);
          const end = new Date(ev.end);
          const day = start.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric"
          });
          const time = `${start.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit"
          })} – ${end.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit"
          })}`;
          return (
            <li
              key={ev.id}
              className="flex items-start justify-between rounded-lg bg-elevated/40 px-3 py-2.5 cursor-pointer"
            >
              <div>
                <div className="text-xs text-muted uppercase tracking-wide mb-0.5">
                  {day}
                </div>
                <div className="text-sm font-medium">{ev.title}</div>
                <div className="text-xs text-muted mt-0.5">
                  {time}
                  {ev.location ? ` · ${ev.location}` : ""}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {ev.has_conflict ? (
                  <Pill label="Conflict" tone="danger" />
                ) : (
                  <Pill label={ev.status} tone="default" />
                )}
                {ev.attendees_count ? (
                  <span className="text-[11px] text-muted">
                    {ev.attendees_count} attendee
                    {ev.attendees_count > 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  const InboxCard = () => {
    if (emailLoading) {
      return (
        <div className="text-muted text-sm flex items-center gap-2">
          <span>⏳</span>
          <span>Loading inbox…</span>
        </div>
      );
    }
    if (!emailTasks.length) {
      return (
        <div className="text-muted text-sm flex flex-col items-center justify-center py-8">
          <span className="text-4xl mb-2">📧</span>
          <span>No email-derived tasks</span>
        </div>
      );
    }
    return (
      <ul className="space-y-2 max-h-64 overflow-auto pr-1 text-sm">
        {emailTasks.map((t) => (
          <li
            key={t.id}
            className="rounded-lg bg-elevated/40 px-3 py-2.5 hover:bg-elevated/70 transition-all cursor-pointer animate-fade-in"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-medium">{t.title}</div>
                <div className="text-xs text-muted mt-0.5">
                  {t.project ? `${t.project}` : "Inbox"}
                  {t.section ? ` · ${t.section}` : ""}
                </div>
                {t.due_datetime_utc ? (
                  <div className="text-[11px] text-muted mt-0.5">
                    Due{" "}
                    {new Date(t.due_datetime_utc).toLocaleString(undefined, {
                      weekday: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      month: "short",
                      day: "numeric"
                    })}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Pill
                  label={`P${t.priority}`}
                  tone={
                    t.priority >= 4
                      ? "danger"
                      : t.priority === 3
                      ? "warning"
                      : "default"
                  }
                />
                {t.labels?.length ? (
                  <span className="text-[11px] text-muted">
                    {t.labels.join(" · ")}
                  </span>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-system">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                <span className="vizoro-neon">Vizoro</span>
                <span className="text-foreground ml-2 text-xl font-normal">.ai</span>
              </h1>
              <div className="hidden md:flex items-center">
                <span className="cyberpunk-time text-sm font-mono">{currentTime.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
              </div>
            </div>
            <p className="text-sm text-muted">
              Welcome back, <span className="text-foreground font-medium">{userEmail.split("@")[0]}</span> • {getGreeting()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Switcher */}
            <div className="flex items-center gap-2 bg-elevated/60 rounded-lg p-1 border border-outline/40">
              {Object.keys(themes).map((themeName) => (
                <button
                  key={themeName}
                  onClick={() => handleThemeChange(themeName)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                    currentTheme === themeName
                      ? "bg-grey-700 text-white shadow-md"
                      : "text-muted hover:text-foreground hover:bg-elevated/40"
                  }`}
                  title={`Switch to ${themes[themeName].name} theme`}
                >
                  {themes[themeName].name}
                </button>
              ))}
            </div>
            <div className="flex flex-col items-end text-xs text-muted">
              <span className="uppercase tracking-wide font-semibold">
                {userEmail}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-elevated/60 text-muted text-xs font-medium border border-outline/40"
              title="Sign out"
            >
              Logout
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple/20 to-neon-purple/10 border border-neon-purple/30 flex items-center justify-center text-xs font-bold text-neon-purple">
              V
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/40 text-danger/90 text-sm">
            ⚠️ {error}
          </div>
        )}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <section className="lg:col-span-2 space-y-5">
            <Card title="Agent Command">
              <CommandInput onSubmit={runCommand} busy={agentBusy} />
            </Card>

            <Card title="Quick Add Task">
              <QuickTaskForm onSubmit={handleCreateTask} busy={tasksLoading} />
            </Card>

            <Card title="Active Tasks">
              <div className="flex items-center justify-between mb-3 text-xs">
                <div className="flex gap-2 items-center">
                  <Pill label={`${activeTasks.length} active`} tone={activeTasks.length ? "warning" : "success"} />
                  <Pill label={`${completedTasks.length} completed`} />
                </div>
              </div>
              <TaskList 
                tasks={activeTasks} 
                loading={tasksLoading}
                onComplete={handleCompleteTask}
                onDelete={handleDeleteTask}
                showActions={true}
              />
            </Card>

            <Card title="History of Tasks Done">
              <div className="flex items-center justify-between mb-3 text-xs">
                <Pill label={`${completedTasks.length} completed`} tone="default" />
              </div>
              <TaskList 
                tasks={completedTasks.slice(0, 10)}
                loading={tasksLoading}
                onDelete={handleDeleteTask}
                showActions={true}
              />
            </Card>

            <Card title="History of Tasks Given">
              <div className="flex items-center justify-between mb-3 text-xs">
                <Pill label={`${tasks.length} total assigned`} tone="default" />
              </div>
              <TaskList 
                tasks={tasks.slice(0, 10)}
                loading={tasksLoading}
                onDelete={handleDeleteTask}
                showActions={true}
              />
            </Card>

            <Card title="Calendar (Google sample)">
              <CalendarCard />
            </Card>
          </section>

          <section className="space-y-5">
            <Card title="Agent Reasoning">
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="text-muted uppercase tracking-wide font-semibold">
                  Current intent
                </span>
                <Pill
                  label={intent ?? "—"}
                  tone={intent ? "default" : "default"}
                />
              </div>
              <ActivityLog steps={steps} results={results} />
            </Card>

            <Card title="Inbox">
              <InboxCard />
            </Card>

            <Card title="System Health">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Backend</span>
                  <Pill label="Online (localhost:8000)" tone="success" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Agent Engine</span>
                  <Pill label={agentBusy ? "Processing" : "Idle"} tone={agentBusy ? "warning" : "success"} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Datasets</span>
                  <span className="text-[11px] text-muted">
                    Google Calendar · Todoist · Productivity · Logs
                  </span>
                </div>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}



