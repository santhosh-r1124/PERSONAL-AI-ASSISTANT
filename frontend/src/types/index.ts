export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  intent?: string;
  metadata?: Record<string, unknown>;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  status: string;
  priority: number;
  source?: string;
  due_datetime_utc?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  status: string;
  location?: string;
  attendees_count?: number;
  is_all_day?: boolean;
  has_conflict?: boolean;
}

export interface EmailTask {
  id: string;
  title: string;
  project?: string;
  section?: string;
  priority: number;
  due_datetime_utc?: string | null;
  labels?: string[];
}

export interface ChatApiResponse {
  response: string;
  intent: string;
  conversation_id: string;
  metadata: {
    steps_count: number;
    results_count: number;
    tools_used: string[];
  };
}

export interface TasksApiResponse {
  active: Task[];
  completed: Task[];
  all: Task[];
}
