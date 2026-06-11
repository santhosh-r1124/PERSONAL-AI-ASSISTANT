import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getTheme, setTheme, themes, applyTheme } from "./theme";
import LoginPage from "./pages/LoginPage";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { ChatArea } from "./components/Chat/ChatArea";
import { ChatInput } from "./components/Input/ChatInput";
import { AnimatedBackground } from "./components/Background/AnimatedBackground";
import { Badge } from "./components/ui/Badge";
import { Button } from "./components/ui/Button";
import { useChat } from "./hooks/useChat";
import { useVoiceAssistant } from "./hooks/useVoiceAssistant";
import { IntegrationsPanel } from "./components/Settings/IntegrationsPanel";
import { VoiceAssistantBar } from "./components/Voice/VoiceAssistantBar";
import {
  Sparkles,
  Calendar,
  Mail,
  Plus,
  Trash2,
  CheckCircle,
  Play,
  Clock,
  ListTodo,
  RefreshCw,
  Loader2,
  AlertTriangle
} from "lucide-react";
import type { Task, CalendarEvent, EmailTask } from "./types";

const DEFAULT_USER_EMAIL = "demo@example.com";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("userEmail") !== null;
  });
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem("userEmail") || DEFAULT_USER_EMAIL;
  });
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  // State Tabs
  const [activeTab, setActiveTab] = useState<"chat" | "dashboard" | "settings">("chat");

  // Dashboard Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Calendar State
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Email Tasks State
  const [emailTasks, setEmailTasks] = useState<EmailTask[]>([]);
  const [emailLoading, setEmailLoading] = useState(false);

  // Agent Console State
  const [agentBusy, setAgentBusy] = useState(false);
  const [intent, setIntent] = useState<string | null>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  
  // Custom Create Task Form State
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState(1);

  // Global Error & Clock State
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Chat custom hook
  const {
    conversations,
    activeConversation,
    activeConversationId,
    isTyping,
    newConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    stopGeneration,
    regenerateLastMessage,
    addVoiceExchange,
  } = useChat(userEmail);

  const voice = useVoiceAssistant(userEmail);

  const handleVoiceToggle = useCallback(() => {
    voice.toggleListening((transcript, response) => {
      addVoiceExchange(transcript, response);
    });
  }, [voice, addVoiceExchange]);

  // Initialize theme
  useEffect(() => {
    applyTheme(getTheme());
  }, []);

  // Handle OAuth redirect callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get("oauth");
    if (oauth === "google_success") {
      setActiveTab("settings");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Timer Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = (email: string) => {
    localStorage.setItem("userEmail", email);
    setUserEmail(email);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    setIsLoggedIn(false);
    setUserEmail(DEFAULT_USER_EMAIL);
  };

  const handleThemeChange = (themeName: string) => {
    setCurrentTheme(themeName);
    setTheme(themeName);
    applyTheme(themes[themeName]);
  };

  // API Call: Fetch Tasks
  const fetchTasks = async () => {
    setTasksLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/tasks", {
        params: { user_email: userEmail },
      });
      if (res.data && typeof res.data === "object" && "active" in res.data) {
        setActiveTasks(res.data.active || []);
        setCompletedTasks(res.data.completed || []);
        setTasks(res.data.all || []);
      } else {
        const raw = (res.data as Task[]) || [];
        setTasks(raw);
        setActiveTasks(raw.filter((t) => t.status === "open" || t.status === "scheduled"));
        setCompletedTasks(raw.filter((t) => t.status === "completed"));
      }
    } catch (err: any) {
      console.error("Failed to fetch tasks", err);
      setError("Unable to connect to the backend server. Verify uvicorn is running on port 8000.");
    } finally {
      setTasksLoading(false);
    }
  };

  // API Call: Fetch Calendar Events
  const fetchCalendar = async () => {
    setCalendarLoading(true);
    try {
      const res = await axios.get("/api/calendar/events", {
        params: { user_email: userEmail },
      });
      const events = (res.data as CalendarEvent[]) || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date("2026-01-01T00:00:00Z");
      const filtered = events.filter((ev) => {
        if (!ev.start) return false;
        const startDate = new Date(ev.start);
        return startDate >= today && startDate <= endDate;
      });
      setCalendarEvents(filtered);
    } catch (err) {
      console.error("Failed to fetch calendar", err);
    } finally {
      setCalendarLoading(false);
    }
  };

  // API Call: Fetch Email Action Items
  const fetchEmailTasks = async () => {
    setEmailLoading(true);
    try {
      const res = await axios.get("/api/inbox/email-tasks", {
        params: { user_email: userEmail },
      });
      setEmailTasks((res.data as EmailTask[]) || []);
    } catch (err) {
      console.error("Failed to fetch email tasks", err);
    } finally {
      setEmailLoading(false);
    }
  };

  // API Call: Run Autonomous Loop Cycle
  const runAutonomousAgent = async () => {
    try {
      const res = await axios.post("/api/agent/autonomous/run", null, {
        params: { user_email: userEmail },
      });
      if (res.data?.results) {
        const results = res.data.results;
        if (
          results.tasks_created_email > 0 ||
          results.tasks_created_calendar > 0 ||
          results.tasks_completed > 0
        ) {
          await fetchTasks();
        }
      }
    } catch (err) {
      console.error("Autonomous agent execution failed", err);
    }
  };

  // Hook load triggers
  useEffect(() => {
    if (isLoggedIn && userEmail) {
      fetchTasks();
      fetchCalendar();
      fetchEmailTasks();
      runAutonomousAgent();
    }
  }, [isLoggedIn, userEmail]);

  // Run auto agent cycle every 5 minutes
  useEffect(() => {
    if (!isLoggedIn || !userEmail) return;
    const interval = setInterval(() => {
      runAutonomousAgent();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn, userEmail]);

  // Handle Quick Task Creation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || tasksLoading) return;
    try {
      await axios.post("/api/tasks/create", {
        user_email: userEmail,
        title: newTitle.trim(),
        priority: newPriority,
      });
      setNewTitle("");
      setNewPriority(1);
      await fetchTasks();
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  // Handle Complete Task
  const handleCompleteTask = async (taskId: string) => {
    try {
      await axios.patch(
        `/api/tasks/${taskId}`,
        { status: "completed" },
        { params: { user_email: userEmail } }
      );
      await fetchTasks();
      // If we are in active chat, synchronize the updates
      if (activeConversationId) {
        await fetchTasks();
      }
    } catch (err) {
      console.error("Failed to complete task", err);
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(`/api/tasks/${taskId}`, {
        params: { user_email: userEmail },
      });
      await fetchTasks();
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  // Handle execution of direct instructions on the Dashboard tab
  const handleRunCustomCommand = async (text: string) => {
    setAgentBusy(true);
    setError(null);
    setIntent(null);
    setSteps([]);
    setResults([]);
    try {
      const res = await axios.post("/api/agent/command", {
        user_email: userEmail,
        text,
      });
      setIntent(res.data.intent);
      setSteps(res.data.steps ?? []);
      setResults(res.data.results ?? []);
      await fetchTasks();
      await fetchCalendar();
    } catch (err: any) {
      console.error("Direct dashboard instruction failed", err);
      setError("Failed to process command. Please check if uvicorn is running.");
    } finally {
      setAgentBusy(false);
    }
  };

  const handleSelectPrompt = useCallback((prompt: string) => {
    sendMessage(prompt);
  }, [sendMessage]);

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-system relative">
      {/* Background canvas */}
      <AnimatedBackground />

      {/* Collapsible Left Navigation Sidebar */}
      <Sidebar
        userEmail={userEmail}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        conversations={conversations}
        activeConversationId={activeConversationId}
        selectConversation={selectConversation}
        newConversation={newConversation}
        deleteConversation={deleteConversation}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        onLogout={handleLogout}
        voiceEnabled={voice.settings.enabled}
        onVoiceToggle={(enabled) => voice.updateSettings({ enabled })}
        autoSpeak={voice.settings.autoSpeak}
        onAutoSpeakToggle={(enabled) => voice.updateSettings({ autoSpeak: enabled })}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 bg-transparent">
        
        {/* Top Navbar Header */}
        <header className="flex items-center justify-between border-b border-outline/25 px-6 py-4 bg-surface/15 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-foreground">
              {activeTab === "chat"
                ? "AI Chat Terminal"
                : activeTab === "settings"
                ? "Integrations & API Keys"
                : "Operations Hub"}
            </span>
            {error && (
              <Badge variant="danger" className="text-[10px]">
                <AlertTriangle size={11} className="mr-1" />
                Connection Offline
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Real-time Clock display */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted font-mono bg-elevated/40 border border-outline/25 rounded-lg px-2.5 py-1">
              <Clock size={12} />
              <span>
                {currentTime.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>

            {/* Sync Data Button */}
            <Button
              variant="glass"
              size="sm"
              onClick={async () => {
                await fetchTasks();
                await fetchCalendar();
                await fetchEmailTasks();
              }}
              className="flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={tasksLoading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Sync Node</span>
            </Button>
          </div>
        </header>

        {/* Tab Content Router */}
        {activeTab === "chat" ? (
          /* ========================================================
             Tab 1: AI Assistant Chat Area
             ======================================================== */
          <div className="flex-1 flex flex-col min-h-0 bg-transparent">
            {/* Conversation Flow Area */}
            <ChatArea
              messages={activeConversation?.messages ?? []}
              isTyping={isTyping}
              onSelectPrompt={handleSelectPrompt}
              onRegenerate={regenerateLastMessage}
            />

            {/* Voice Assistant Bar */}
            {voice.settings.enabled && (
              <VoiceAssistantBar
                isListening={voice.isListening}
                isProcessing={voice.isProcessing}
                isSpeaking={voice.isSpeaking}
                interimTranscript={voice.interimTranscript}
                error={voice.error}
                voiceEnabled={voice.settings.enabled}
                onToggleVoice={handleVoiceToggle}
                onStopSpeaking={voice.stopSpeaking}
              />
            )}

            {/* Sticky Prompt / Message Input */}
            <ChatInput
              onSend={sendMessage}
              isTyping={isTyping}
              onStop={stopGeneration}
              onVoiceToggle={handleVoiceToggle}
              isListening={voice.isListening}
              voiceEnabled={voice.settings.enabled}
              interimTranscript={voice.interimTranscript}
            />
          </div>
        ) : activeTab === "settings" ? (
          <IntegrationsPanel userEmail={userEmail} />
        ) : (
          /* ========================================================
             Tab 2: Operations / Tasks Dashboard Area
             ======================================================== */
          <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-white/5 space-y-6">
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Trigger Autonomous Agent actions bar */}
              <div className="bg-gradient-to-r from-[var(--neon-purple)]/10 to-transparent border border-[var(--neon-purple)]/25 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--neon-purple)]/15 border border-[var(--neon-purple)]/30 text-[var(--neon-purple)]">
                    <Sparkles size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      Autonomous Intelligence Core
                    </h3>
                    <p className="text-xs text-muted">
                      Triggers self-healing scripts, auto-completes overdue tasks, extracts calendar changes.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={async () => {
                    setTasksLoading(true);
                    await runAutonomousAgent();
                    await fetchTasks();
                    setTasksLoading(false);
                  }}
                  disabled={tasksLoading}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Play size={14} />
                  <span>Execute Auto Cycle</span>
                </Button>
              </div>

              {/* Grid 3x2 Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Panel A: Quick Task Creator */}
                <div className="bg-surface/30 backdrop-blur-md border border-outline/35 rounded-2xl p-5 shadow-lg flex flex-col">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
                    <Plus size={14} className="text-[var(--neon-purple)]" />
                    Quick Task Entry
                  </h3>
                  <form onSubmit={handleCreateTask} className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                          Task Name
                        </label>
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="e.g., File expense report"
                          className="w-full bg-elevated/50 border border-outline/35 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-[var(--neon-purple)]/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                          Priority Rank
                        </label>
                        <select
                          value={newPriority}
                          onChange={(e) => setNewPriority(parseInt(e.target.value))}
                          className="w-full bg-elevated/50 border border-outline/35 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
                        >
                          <option value={1}>P1 (Default / Info)</option>
                          <option value={2}>P2 (Low priority)</option>
                          <option value={3}>P3 (Medium attention)</option>
                          <option value={4}>P4 (High critical rank)</option>
                        </select>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={!newTitle.trim() || tasksLoading}
                      className="w-full mt-4 flex items-center justify-center gap-2"
                    >
                      {tasksLoading ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                      Create Task
                    </Button>
                  </form>
                </div>

                {/* Panel B: Active Tasks */}
                <div className="bg-surface/30 backdrop-blur-md border border-outline/35 rounded-2xl p-5 shadow-lg flex flex-col lg:col-span-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ListTodo size={14} className="text-[var(--neon-purple)]" />
                      Active Queue ({activeTasks.length})
                    </span>
                    {tasksLoading && <Loader2 size={12} className="animate-spin text-muted" />}
                  </h3>
                  
                  {activeTasks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                      <CheckCircle size={32} className="text-muted/40 mb-2" />
                      <p className="text-xs text-muted font-medium">No active tasks in system</p>
                      <span className="text-[10px] text-muted/60">Create one using the form on the left!</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 pr-1">
                      {activeTasks.map((t) => {
                        const isAuto = t.source && (t.source.includes("email") || t.source.includes("calendar"));
                        return (
                          <div
                            key={t.id}
                            className="flex items-center justify-between p-3 bg-elevated/40 border border-outline/20 rounded-xl group hover:border-outline/40 transition-all duration-300"
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <button
                                onClick={() => handleCompleteTask(t.id)}
                                className="w-5 h-5 rounded-md border border-outline/50 flex items-center justify-center hover:border-success/60 hover:bg-success/10 text-transparent hover:text-success transition-all cursor-pointer flex-shrink-0"
                              >
                                ✓
                              </button>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-semibold text-foreground truncate">{t.title}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {isAuto && (
                                    <Badge variant="purple" className="text-[8px] py-0 px-1 border-0">
                                      AI Extract
                                    </Badge>
                                  )}
                                  <span className="text-[9px] text-muted capitalize">
                                    Source: {t.source || "user"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  t.priority >= 4 ? "danger" : t.priority === 3 ? "warning" : "default"
                                }
                                className="text-[9px] font-bold"
                              >
                                P{t.priority}
                              </Badge>
                              <button
                                onClick={() => handleDeleteTask(t.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-danger rounded hover:bg-danger/10 transition-all cursor-pointer"
                                title="Delete task"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Panel C: Calendar Tracker */}
                <div className="bg-surface/30 backdrop-blur-md border border-outline/35 rounded-2xl p-5 shadow-lg flex flex-col">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar size={14} className="text-[var(--neon-purple)]" />
                      Calendar Schedule
                    </span>
                    {calendarLoading && <Loader2 size={12} className="animate-spin text-muted" />}
                  </h3>
                  
                  {calendarEvents.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                      <Calendar size={28} className="text-muted/40 mb-2" />
                      <p className="text-xs text-muted font-medium">Calendar clear</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 pr-1">
                      {calendarEvents.map((ev) => {
                        const start = new Date(ev.start);
                        const startText = start.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        });
                        const timeText = start.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        return (
                          <div
                            key={ev.id}
                            className="p-3 bg-elevated/30 border border-outline/15 rounded-xl flex items-start justify-between gap-2"
                          >
                            <div className="overflow-hidden">
                              <span className="text-[9px] font-bold text-[var(--neon-purple)] uppercase tracking-wider block">
                                {startText} • {timeText}
                              </span>
                              <span className="text-xs font-semibold text-foreground block truncate mt-0.5">
                                {ev.title}
                              </span>
                              {ev.location && (
                                <span className="text-[10px] text-muted block truncate mt-0.5">
                                  📍 {ev.location}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                              {ev.has_conflict ? (
                                <Badge variant="danger" className="text-[8px] tracking-wide">
                                  Conflict
                                </Badge>
                              ) : (
                                <Badge variant="default" className="text-[8px]">
                                  {ev.status}
                                </Badge>
                              )}
                              {ev.attendees_count && ev.attendees_count > 0 ? (
                                <span className="text-[9px] text-muted">
                                  {ev.attendees_count} guest{ev.attendees_count > 1 ? "s" : ""}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Panel D: Email-Derived Task Inbox */}
                <div className="bg-surface/30 backdrop-blur-md border border-outline/35 rounded-2xl p-5 shadow-lg flex flex-col">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Mail size={14} className="text-[var(--neon-purple)]" />
                      Email Action items
                    </span>
                    {emailLoading && <Loader2 size={12} className="animate-spin text-muted" />}
                  </h3>
                  
                  {emailTasks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                      <Mail size={28} className="text-muted/40 mb-2" />
                      <p className="text-xs text-muted font-medium">No inbox tasks detected</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 pr-1">
                      {emailTasks.map((t) => (
                        <div
                          key={t.id}
                          className="p-3 bg-elevated/30 border border-outline/15 rounded-xl flex items-start justify-between gap-2"
                        >
                          <div className="overflow-hidden">
                            <span className="text-xs font-semibold text-foreground block truncate">
                              {t.title}
                            </span>
                            <span className="text-[9px] text-muted block mt-0.5">
                              {t.project ? `${t.project}` : "Inbox"}{" "}
                              {t.section ? `• ${t.section}` : ""}
                            </span>
                            {t.due_datetime_utc && (
                              <span className="text-[9px] text-[var(--neon-purple)] block mt-0.5">
                                Due {new Date(t.due_datetime_utc).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <Badge
                            variant={
                              t.priority >= 4 ? "danger" : t.priority === 3 ? "warning" : "default"
                            }
                            className="text-[8px] flex-shrink-0"
                          >
                            P{t.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Panel E: Completed Tasks */}
                <div className="bg-surface/30 backdrop-blur-md border border-outline/35 rounded-2xl p-5 shadow-lg flex flex-col">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
                    <CheckCircle size={14} className="text-success" />
                    Completed archive ({completedTasks.length})
                  </h3>
                  
                  {completedTasks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                      <CheckCircle size={28} className="text-muted/40 mb-2" />
                      <p className="text-xs text-muted font-medium">No completed tasks yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 pr-1">
                      {completedTasks.map((t) => (
                        <div
                          key={t.id}
                          className="p-3 bg-elevated/20 border border-outline/10 rounded-xl flex items-center justify-between"
                        >
                          <span className="text-xs text-muted line-through truncate mr-2">
                            {t.title}
                          </span>
                          <span className="text-[9px] text-success font-bold bg-success/10 border border-success/20 px-1.5 py-0.5 rounded-md">
                            Archived
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Panel F: Agent Console Logs */}
              <div className="bg-surface/30 backdrop-blur-md border border-outline/35 rounded-2xl p-5 shadow-lg flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock size={14} className="text-[var(--neon-purple)]" />
                    Agent Trace Console
                  </span>
                  {intent && (
                    <Badge variant="purple" className="text-[8px] uppercase tracking-wider font-bold">
                      Intent: {intent}
                    </Badge>
                  )}
                </h3>
                
                {steps.length === 0 && results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted">
                    <span className="text-3xl mb-2">🧠</span>
                    <p className="text-xs font-medium">Console Idle</p>
                    <span className="text-[10px] text-muted/60">
                      Submit instructions or run manual agent cycle to trace operations.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto font-mono text-[11px] leading-relaxed bg-black/30 border border-outline/15 rounded-xl p-4">
                    {/* Execution steps */}
                    <div className="space-y-2">
                      <div className="text-muted/80 border-b border-outline/15 pb-1 font-bold text-[10px] uppercase tracking-wider">
                        Step-by-step Trace
                      </div>
                      {steps.map((s, idx) => (
                        <div key={idx} className="flex gap-2 items-start text-foreground/90">
                          <span className="text-[var(--neon-purple)] font-bold">{idx + 1}.</span>
                          <div>
                            <span className="font-semibold">{s.description}</span>
                            {s.tool_calls?.length > 0 && (
                              <div className="text-muted text-[10px] mt-0.5">
                                Tool Invocation:{" "}
                                {s.tool_calls.map((tc: any) => tc.name).join(", ")}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Execution results */}
                    <div className="space-y-2 mt-4 pt-4 border-t border-outline/15">
                      <div className="text-muted/80 border-b border-outline/15 pb-1 font-bold text-[10px] uppercase tracking-wider">
                        Evaluation Results
                      </div>
                      {results.map((r, idx) => {
                        let contentText = "";
                        if (r.error) {
                          contentText = `Error: ${r.error}`;
                        } else if (r.result) {
                          if (Array.isArray(r.result)) {
                            contentText = `Returned array containing ${r.result.length} element(s).`;
                          } else if (typeof r.result === "object") {
                            contentText = JSON.stringify(r.result);
                          } else {
                            contentText = String(r.result);
                          }
                        }
                        return (
                          <div key={idx} className="text-foreground/85">
                            <span className="text-emerald-400 font-bold">[{r.tool}]</span>
                            <span className="text-muted/95 ml-1">: {contentText}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
