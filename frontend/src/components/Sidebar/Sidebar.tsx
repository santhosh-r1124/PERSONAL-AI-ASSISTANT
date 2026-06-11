import React, { useState } from "react";
import {
  MessageSquare,
  LayoutDashboard,
  Plus,
  Trash2,
  LogOut,
  Search,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Bot,
  Settings,
  Mic,
  Volume2
} from "lucide-react";
import type { Conversation } from "../../types";

interface SidebarProps {
  userEmail: string;
  activeTab: "chat" | "dashboard" | "settings";
  setActiveTab: (tab: "chat" | "dashboard" | "settings") => void;
  voiceEnabled?: boolean;
  onVoiceToggle?: (enabled: boolean) => void;
  autoSpeak?: boolean;
  onAutoSpeakToggle?: (enabled: boolean) => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  selectConversation: (id: string) => void;
  newConversation: () => void;
  deleteConversation: (id: string) => void;
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  onLogout: () => void;
}

export function Sidebar({
  userEmail,
  activeTab,
  setActiveTab,
  conversations,
  activeConversationId,
  selectConversation,
  newConversation,
  deleteConversation,
  currentTheme,
  onThemeChange,
  onLogout,
  voiceEnabled = true,
  onVoiceToggle,
  autoSpeak = true,
  onAutoSpeakToggle,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="relative flex-shrink-0 h-full select-none z-30">
      {/* Collapse Trigger Button */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-4 z-40 flex items-center justify-center w-7 h-7 rounded-lg border border-outline/35 bg-surface/80 backdrop-blur-md text-muted hover:text-foreground shadow-md transition-all duration-300 cursor-pointer ${
          isOpen ? "left-[246px]" : "left-4"
        }`}
        title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Sidebar Container */}
      <div
        className={`h-full bg-surface/30 backdrop-blur-xl border-r border-outline/25 flex flex-col transition-all duration-300 ease-in-out relative overflow-hidden ${
          isOpen ? "w-[260px]" : "w-0 border-r-transparent pointer-events-none"
        }`}
      >
        {/* Brand/Header */}
        <div className="p-4 border-b border-outline/25 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--neon-purple)] to-[var(--accent-light)] flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.25)]">
            <Bot size={20} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm text-foreground tracking-wide">
              PERSONAL AGENT
            </span>
            <span className="text-[10px] text-muted font-medium tracking-wider">
              V4 HYPERDRIVE
            </span>
          </div>
        </div>

        {/* Workspace Navigation */}
        <div className="p-3 space-y-1">
          <button
            onClick={() => setActiveTab("chat")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
              activeTab === "chat"
                ? "bg-gradient-to-r from-[var(--neon-purple)]/15 to-purple-500/5 text-[var(--neon-purple)] border border-[var(--neon-purple)]/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                : "text-muted hover:text-foreground hover:bg-elevated/40 border border-transparent"
            }`}
          >
            <MessageSquare size={16} />
            <span>AI Chat Assistant</span>
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-gradient-to-r from-[var(--neon-purple)]/15 to-purple-500/5 text-[var(--neon-purple)] border border-[var(--neon-purple)]/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                : "text-muted hover:text-foreground hover:bg-elevated/40 border border-transparent"
            }`}
          >
            <LayoutDashboard size={16} />
            <span>Tasks Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
              activeTab === "settings"
                ? "bg-gradient-to-r from-[var(--neon-purple)]/15 to-purple-500/5 text-[var(--neon-purple)] border border-[var(--neon-purple)]/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                : "text-muted hover:text-foreground hover:bg-elevated/40 border border-transparent"
            }`}
          >
            <Settings size={16} />
            <span>Integrations</span>
          </button>
        </div>

        {/* Chat History Section - only interactive/scrollable if Chat is active */}
        <div className="flex-1 flex flex-col min-h-0 border-t border-outline/20 pt-4">
          <div className="px-4 flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Conversations
            </span>
            {activeTab === "chat" && (
              <button
                onClick={newConversation}
                className="p-1 rounded-md border border-outline/35 bg-elevated/50 text-muted hover:text-foreground hover:bg-elevated transition-all cursor-pointer"
                title="New chat session"
              >
                <Plus size={12} />
              </button>
            )}
          </div>

          {/* Search bar inside conversations */}
          <div className="px-3 mb-2">
            <div className="relative flex items-center bg-elevated/40 border border-outline/25 rounded-lg focus-within:border-[var(--neon-purple)]/30 px-2.5 py-1.5 transition-all">
              <Search size={12} className="text-muted/60 mr-2" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-0 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-0 p-0"
              />
            </div>
          </div>

          {/* Scrollable Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin scrollbar-thumb-white/5 pr-1">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted/60 font-medium">
                No active conversations
              </div>
            ) : (
              filteredConversations.map((convo) => {
                const isActive = convo.id === activeConversationId;
                return (
                  <div
                    key={convo.id}
                    onClick={() => {
                      setActiveTab("chat");
                      selectConversation(convo.id);
                    }}
                    className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                      isActive && activeTab === "chat"
                        ? "bg-elevated text-foreground border border-outline/30"
                        : "text-muted hover:text-foreground hover:bg-elevated/30 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      <MessageSquare size={12} className="flex-shrink-0 text-muted/65 group-hover:text-[var(--neon-purple)] transition-colors" />
                      <span className="truncate">{convo.title || "Untitled Chat"}</span>
                    </div>
                    
                    {/* Delete Session Button (visible on hover) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(convo.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-danger p-0.5 rounded transition-all cursor-pointer"
                      title="Delete conversation"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Area */}
        <div className="p-3 border-t border-outline/25 space-y-3 bg-elevated/30">
          {/* User Profile */}
          <div className="flex items-center justify-between gap-2 bg-elevated/40 border border-outline/20 rounded-xl p-2.5">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[var(--neon-purple)]/15 border border-[var(--neon-purple)]/20 text-[var(--neon-purple)] font-bold flex items-center justify-center text-xs flex-shrink-0">
                {userEmail ? userEmail.substring(0, 2).toUpperCase() : "US"}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs text-foreground font-semibold truncate leading-tight">
                  {userEmail ? userEmail.split("@")[0] : "user"}
                </span>
                <span className="text-[9px] text-muted truncate leading-none">
                  {userEmail}
                </span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="text-muted hover:text-danger p-1 rounded-lg hover:bg-danger/10 transition-all cursor-pointer"
              title="Log out"
            >
              <LogOut size={14} />
            </button>
          </div>

          {/* Voice Assistant Toggles */}
          <div className="space-y-1.5 border border-outline/20 rounded-xl p-2 bg-elevated/20">
            <button
              onClick={() => onVoiceToggle?.(!voiceEnabled)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                voiceEnabled
                  ? "bg-[var(--neon-purple)]/15 text-[var(--neon-purple)]"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Mic size={12} />
                Voice Assistant
              </span>
              <span className="text-[10px]">{voiceEnabled ? "ON" : "OFF"}</span>
            </button>
            <button
              onClick={() => onAutoSpeakToggle?.(!autoSpeak)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                autoSpeak
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Volume2 size={12} />
                Speak Responses
              </span>
              <span className="text-[10px]">{autoSpeak ? "ON" : "OFF"}</span>
            </button>
          </div>

          {/* Theme Settings Selector */}
          <div className="flex items-center justify-between border border-outline/20 rounded-xl p-1.5 bg-elevated/20">
            <button
              onClick={() => onThemeChange("dark")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTheme === "dark"
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Moon size={12} />
              <span>Dark</span>
            </button>
            <button
              onClick={() => onThemeChange("light")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTheme === "light"
                  ? "bg-white text-black shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Sun size={12} />
              <span>Light</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
