import React from "react";

export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-2.5 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md max-w-xs animate-pulse">
      <div className="w-2.5 h-2.5 bg-[var(--neon-purple)] rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2.5 h-2.5 bg-[var(--neon-purple)] rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2.5 h-2.5 bg-[var(--neon-purple)] rounded-full animate-bounce" />
      <span className="text-xs text-muted font-medium ml-1">Agent thinking...</span>
    </div>
  );
}
