import React from "react";
import { PlusCircle, ListTodo, Mail, Play } from "lucide-react";

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

export function WelcomeScreen({ onSelectPrompt }: WelcomeScreenProps) {
  const suggestions = [
    {
      title: "Create Task",
      desc: "Create a task to finish the Q3 presentation",
      prompt: "Create a task to finish the Q3 presentation with priority 3",
      icon: PlusCircle,
      color: "text-purple-400 border-purple-500/20 bg-purple-500/5",
    },
    {
      title: "List Tasks",
      desc: "Show all my currently open tasks",
      prompt: "List all my open tasks",
      icon: ListTodo,
      color: "text-blue-400 border-blue-500/20 bg-blue-500/5",
    },
    {
      title: "Sync Email Tasks",
      desc: "Extract action items from recent emails",
      prompt: "Pull tasks from my recent emails",
      icon: Mail,
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    },
    {
      title: "Autonomous Cycle",
      desc: "Run autonomous AI agent automation loop",
      prompt: "Run the autonomous agent",
      icon: Play,
      color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto px-4 text-center">
      {/* Animated Glowing Logo */}
      <div className="relative mb-8 group">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--neon-purple)] to-purple-600 blur-xl opacity-40 group-hover:opacity-75 transition-opacity duration-500 animate-pulse" />
        <div className="relative w-20 h-20 rounded-2xl bg-black/60 border border-[var(--neon-purple)]/40 flex items-center justify-center text-4xl shadow-2xl backdrop-blur-md transform group-hover:scale-105 transition-transform duration-300">
          ⚡
        </div>
      </div>

      <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
        Personal AI Assistant
      </h2>
      <p className="mt-3 text-lg text-muted max-w-md">
        Task automation, calendar scheduling, and inbox mining, controlled with natural language.
      </p>

      {/* Suggestion Cards */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {suggestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              className={`flex flex-col items-start text-left p-4 rounded-xl border hover:border-[var(--neon-purple)]/50 bg-surface/40 hover:bg-surface/80 transition-all duration-300 group cursor-pointer relative overflow-hidden`}
            >
              {/* Highlight border on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--neon-purple)]/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className={`p-2 rounded-lg border ${item.color} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-foreground text-sm group-hover:text-[var(--neon-purple)] transition-colors duration-200">
                {item.title}
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {item.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
