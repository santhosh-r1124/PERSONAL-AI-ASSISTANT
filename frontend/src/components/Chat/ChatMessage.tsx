import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, RotateCw, Sparkles } from "lucide-react";
import type { Message } from "../../types";
import { Badge } from "../ui/Badge";

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
  onRegenerate?: () => void;
}

export function ChatMessage({ message, isLast, onRegenerate }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy message", err);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Human-readable labels for agent intents
  const getIntentLabel = (intent?: string) => {
    if (!intent) return null;
    switch (intent) {
      case "create_task":
        return "Task Created";
      case "list_open_tasks":
        return "Tasks Retrieved";
      case "reschedule_tasks":
        return "Tasks Rescheduled";
      case "missed_task_followup":
        return "Missed Tasks Review";
      case "email_to_task":
        return "Email Mining";
      case "general_query":
        return "Information Query";
      default:
        return intent.replace(/_/g, " ");
    }
  };

  return (
    <div
      className={`flex w-full mb-6 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex items-start max-w-[85%] sm:max-w-[75%] gap-3 group`}
      >
        {/* Assistant Avatar */}
        {!isUser && (
          <div className="w-8 h-8 rounded-lg bg-[var(--neon-purple)]/10 border border-[var(--neon-purple)]/30 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(168,85,247,0.15)] flex-shrink-0">
            🤖
          </div>
        )}

        <div className="flex flex-col">
          {/* Bubble container */}
          <div
            className={`px-4 py-3 rounded-2xl border transition-all duration-300 relative ${
              isUser
                ? "bg-gradient-to-br from-[var(--neon-purple)] to-[var(--accent-light)] text-white border-[var(--neon-purple)]/20 rounded-tr-none shadow-[0_4px_12px_rgba(168,85,247,0.1)]"
                : "bg-surface/50 backdrop-blur-md text-foreground border-outline/30 rounded-tl-none shadow-md"
            }`}
          >
            {/* Intent Badge */}
            {!isUser && message.intent && (
              <div className="mb-2">
                <Badge variant="purple" className="text-[10px] uppercase font-bold tracking-wider">
                  <Sparkles size={10} className="mr-1 animate-pulse" />
                  {getIntentLabel(message.intent)}
                </Badge>
              </div>
            )}

            {/* Markdown / Content */}
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{message.content}</p>
            ) : (
              <div className="prose prose-invert max-w-none text-sm leading-relaxed text-foreground">
                <ReactMarkdown
                  components={{
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const lang = match ? match[1] : "";
                      return match ? (
                        <div className="relative my-4 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                          <div className="flex items-center justify-between px-4 py-1.5 bg-black/40 text-xs text-muted font-mono border-b border-white/5">
                            <span>{lang}</span>
                            <button
                              onClick={async () => {
                                await navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
                              }}
                              className="hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              <Copy size={12} />
                              Copy
                            </button>
                          </div>
                          <SyntaxHighlighter
                            style={atomDark}
                            language={lang}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              background: "rgba(0, 0, 0, 0.4)",
                              padding: "1rem",
                              fontSize: "12px",
                            }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                          {children}
                        </code>
                      );
                    },
                    p({ children }) {
                      return <p className="mb-3 last:mb-0 break-words">{children}</p>;
                    },
                    ul({ children }) {
                      return <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>;
                    },
                    li({ children }) {
                      return <li className="leading-relaxed">{children}</li>;
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="border-l-4 border-[var(--neon-purple)] bg-white/5 px-3 py-2 my-2 rounded-r italic text-muted text-xs">
                          {children}
                        </blockquote>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Action Footer (Copy, Regenerate, Timestamp) */}
          <div
            className={`flex items-center mt-1 text-[10px] text-muted space-x-2 px-1 ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            <span>{formatTime(message.timestamp)}</span>
            
            {!message.isStreaming && (
              <>
                <span>•</span>
                <button
                  onClick={handleCopy}
                  className="hover:text-foreground flex items-center gap-0.5 cursor-pointer"
                  title="Copy message text"
                >
                  {copied ? (
                    <>
                      <Check size={10} className="text-success" />
                      <span className="text-success">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={10} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </>
            )}

            {!isUser && isLast && !message.isStreaming && onRegenerate && (
              <>
                <span>•</span>
                <button
                  onClick={onRegenerate}
                  className="hover:text-foreground flex items-center gap-0.5 cursor-pointer"
                  title="Regenerate response"
                >
                  <RotateCw size={10} />
                  <span>Regenerate</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
