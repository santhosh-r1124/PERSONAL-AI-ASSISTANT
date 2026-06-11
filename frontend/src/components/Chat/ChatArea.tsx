import React, { useEffect, useRef } from "react";
import type { Message } from "../../types";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { WelcomeScreen } from "./WelcomeScreen";
import { ScrollArea } from "@radix-ui/react-scroll-area";

interface ChatAreaProps {
  messages: Message[];
  isTyping: boolean;
  onSelectPrompt: (prompt: string) => void;
  onRegenerate: () => void;
}

export function ChatArea({ messages, isTyping, onSelectPrompt, onRegenerate }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex items-center justify-center p-4">
        <WelcomeScreen onSelectPrompt={onSelectPrompt} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
      <div className="max-w-3xl mx-auto w-full">
        {messages.map((msg, index) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isLast={index === messages.length - 1}
            onRegenerate={onRegenerate}
          />
        ))}

        {isTyping && (
          <div className="flex justify-start mb-6">
            <TypingIndicator />
          </div>
        )}

        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
