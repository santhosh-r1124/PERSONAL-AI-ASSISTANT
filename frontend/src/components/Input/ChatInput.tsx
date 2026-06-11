import React, { useState, useRef, useEffect } from "react";
import { Send, Square, Sparkles, Mic, MicOff } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  isTyping: boolean;
  onStop: () => void;
  onVoiceToggle?: () => void;
  isListening?: boolean;
  voiceEnabled?: boolean;
  interimTranscript?: string;
}

export function ChatInput({
  onSend,
  isTyping,
  onStop,
  onVoiceToggle,
  isListening = false,
  voiceEnabled = false,
  interimTranscript = "",
}: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to calculate scrollHeight correctly
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 200); // Max height limit
    textarea.style.height = `${newHeight}px`;
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isTyping) {
      onStop();
      return;
    }
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl mx-auto w-full px-4 mb-4 relative"
    >
      <div className="relative flex items-end w-full bg-surface/50 border border-outline/35 rounded-2xl focus-within:border-[var(--neon-purple)]/50 focus-within:ring-1 focus-within:ring-[var(--neon-purple)]/30 transition-all duration-300 backdrop-blur-md shadow-lg pr-3 pl-4 py-3">
        
        {/* Sparkle Icon Decorator */}
        <div className="mb-1.5 mr-2 text-muted/60 hover:text-[var(--neon-purple)] transition-colors">
          <Sparkles size={16} className={isTyping ? "animate-pulse text-[var(--neon-purple)]" : ""} />
        </div>

        {/* Input Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? `Listening… ${interimTranscript || "speak now"}`
              : "Ask AI assistant to create tasks, check calendar, or tap mic…"
          }
          rows={1}
          className="flex-1 bg-transparent border-0 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-0 resize-none pr-12 max-h-[200px] leading-relaxed py-0.5"
          style={{ minHeight: "24px" }}
        />

        {/* Voice + Send / Stop Action Buttons */}
        <div className="flex items-center gap-1.5">
          {voiceEnabled && onVoiceToggle && (
            <button
              type="button"
              onClick={onVoiceToggle}
              disabled={isTyping}
              className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? "bg-danger/15 text-danger border border-danger/30 animate-pulse"
                  : "bg-[var(--neon-purple)]/10 text-[var(--neon-purple)] border border-[var(--neon-purple)]/20 hover:bg-[var(--neon-purple)]/20"
              } disabled:opacity-30`}
              title={isListening ? "Stop listening" : "Activate voice assistant"}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          )}
          {isTyping ? (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25 transition-all cursor-pointer"
              title="Stop generation"
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!text.trim()}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-r from-[var(--neon-purple)] to-[var(--accent-light)] text-white hover:brightness-110 disabled:opacity-30 disabled:pointer-events-none disabled:hover:brightness-100 transition-all shadow-md cursor-pointer"
              title="Send message"
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </div>
      <p className="text-[10px] text-muted text-center mt-2 leading-relaxed">
        Gemini voice assistant enabled. Try: <span className="text-foreground/60 italic font-mono">"Show my calendar"</span> or tap the <Mic size={10} className="inline" /> mic button.
      </p>
    </form>
  );
}
