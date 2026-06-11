import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import type { Message, Conversation } from "../types";

const STORAGE_KEY = "ai_assistant_conversations";

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    return parsed.map((c) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: c.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
    }));
  } catch {
    return [];
  }
}

function saveConversations(convos: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
  } catch {
    // quota exceeded — silently fail
  }
}

export function useChat(userEmail: string) {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    () => loadConversations()[0]?.id ?? null
  );
  const [isTyping, setIsTyping] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;

  const persist = useCallback((updated: Conversation[]) => {
    setConversations(updated);
    saveConversations(updated);
  }, []);

  const newConversation = useCallback(() => {
    const id = uuidv4();
    const now = new Date();
    const convo: Conversation = {
      id,
      title: "New conversation",
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    const updated = [convo, ...conversations];
    persist(updated);
    setActiveConversationId(id);
    return id;
  }, [conversations, persist]);

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      const updated = conversations.filter((c) => c.id !== id);
      persist(updated);
      if (activeConversationId === id) {
        setActiveConversationId(updated[0]?.id ?? null);
      }
    },
    [conversations, persist, activeConversationId]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      // Ensure there's an active conversation
      let convId = activeConversationId;
      let currentConvos = conversations;

      if (!convId) {
        const id = uuidv4();
        const now = new Date();
        const convo: Conversation = {
          id,
          title: text.slice(0, 40) + (text.length > 40 ? "…" : ""),
          messages: [],
          createdAt: now,
          updatedAt: now,
        };
        currentConvos = [convo, ...conversations];
        convId = id;
        setActiveConversationId(id);
      }

      const userMsg: Message = {
        id: uuidv4(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };

      // Add user message + streaming placeholder
      const assistantMsgId = uuidv4();
      const assistantPlaceholder: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      const withUser = currentConvos.map((c) =>
        c.id === convId
          ? {
              ...c,
              title: c.messages.length === 0 ? text.slice(0, 40) + (text.length > 40 ? "…" : "") : c.title,
              messages: [...c.messages, userMsg, assistantPlaceholder],
              updatedAt: new Date(),
            }
          : c
      );
      persist(withUser);
      setIsTyping(true);

      abortRef.current = new AbortController();

      try {
        const res = await axios.post(
          "/api/chat",
          {
            user_email: userEmail,
            message: text,
            conversation_id: convId,
          },
          { signal: abortRef.current.signal }
        );

        const data = res.data as { response: string; intent: string; metadata: Record<string, unknown> };

        // Simulate streaming by updating the message with full content
        const finalConvos = withUser.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: data.response,
                        intent: data.intent,
                        metadata: data.metadata,
                        isStreaming: false,
                      }
                    : m
                ),
              }
            : c
        );
        persist(finalConvos);
      } catch (err: unknown) {
        if (axios.isCancel(err)) return;
        const errorMsg = "⚠️ **Connection error.** Make sure the backend is running at `http://localhost:8000` and try again.";
        const errorConvos = withUser.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: errorMsg, isStreaming: false }
                    : m
                ),
              }
            : c
        );
        persist(errorConvos);
      } finally {
        setIsTyping(false);
        abortRef.current = null;
      }
    },
    [activeConversationId, conversations, isTyping, persist, userEmail]
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsTyping(false);
  }, []);

  const addVoiceExchange = useCallback(
    (transcript: string, response: string, intent?: string) => {
      let convId = activeConversationId;
      let currentConvos = conversations;

      if (!convId) {
        const id = uuidv4();
        const now = new Date();
        const convo: Conversation = {
          id,
          title: transcript.slice(0, 40) + (transcript.length > 40 ? "…" : ""),
          messages: [],
          createdAt: now,
          updatedAt: now,
        };
        currentConvos = [convo, ...conversations];
        convId = id;
        setActiveConversationId(id);
      }

      const userMsg: Message = {
        id: uuidv4(),
        role: "user",
        content: `🎤 ${transcript}`,
        timestamp: new Date(),
      };
      const assistantMsg: Message = {
        id: uuidv4(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        intent,
      };

      const updated = currentConvos.map((c) =>
        c.id === convId
          ? {
              ...c,
              title: c.messages.length === 0 ? transcript.slice(0, 40) : c.title,
              messages: [...c.messages, userMsg, assistantMsg],
              updatedAt: new Date(),
            }
          : c
      );
      persist(updated);
    },
    [activeConversationId, conversations, persist]
  );

  const regenerateLastMessage = useCallback(async () => {
    if (!activeConversation) return;
    const msgs = activeConversation.messages;
    const lastUser = [...msgs].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    // Remove last assistant message
    const trimmed = msgs.slice(0, msgs.lastIndexOf(lastUser as Message) + 1);
    const updated = conversations.map((c) =>
      c.id === activeConversationId ? { ...c, messages: trimmed } : c
    );
    persist(updated);
    await sendMessage(lastUser.content);
  }, [activeConversation, activeConversationId, conversations, persist, sendMessage]);

  return {
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
  };
}
