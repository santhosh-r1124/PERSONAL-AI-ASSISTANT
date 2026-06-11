import React, { useState, useEffect } from "react";
import { getTheme, setTheme, themes, applyTheme } from "../theme";
import { AnimatedBackground } from "../components/Background/AnimatedBackground";
import { Lock, Mail, Sparkles, Sun, Moon } from "lucide-react";

interface LoginPageProps {
  onLogin: (email: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });
  const [timeString, setTimeString] = useState("");
  const [dateString, setDateString] = useState("");

  // Update time and date string client-side
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setDateString(
        now.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const validateGmail = (email: string) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    return gmailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your Gmail address");
      return;
    }

    if (!validateGmail(email)) {
      setError("Please enter a valid Gmail address (e.g., name@gmail.com)");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    onLogin(email.trim());
  };

  const handleThemeChange = (themeName: "dark" | "light") => {
    setCurrentTheme(themeName);
    setTheme(themeName);
    applyTheme(themes[themeName]);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden select-none">
      {/* Canvas Animated Background */}
      <AnimatedBackground />

      <div className="w-full max-w-md relative z-10">
        {/* Brand/Logo Header */}
        <div className="text-center mb-6">
          <div className="relative w-16 h-16 mx-auto mb-3 group">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--neon-purple)] to-purple-600 blur-lg opacity-40 group-hover:opacity-75 transition-opacity duration-300 animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-black/60 border border-[var(--neon-purple)]/40 flex items-center justify-center text-3xl shadow-xl backdrop-blur-md">
              ⚡
            </div>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-wide uppercase">
            VIZORO OS
          </h1>
          <p className="text-xs text-muted font-medium tracking-widest uppercase mt-0.5">
            Intelligent Task Automation
          </p>
        </div>

        {/* Login Form Panel */}
        <div className="bg-surface/40 border border-outline/35 rounded-2xl shadow-2xl backdrop-blur-md p-8">
          
          {/* Cyberpunk Time & Clock Display */}
          <div className="text-center mb-6 pb-6 border-b border-outline/25">
            <div className="text-4xl font-extralight tracking-widest mb-1.5 font-mono text-foreground select-none">
              {timeString || "00:00:00"}
            </div>
            <div className="text-[10px] text-muted font-semibold uppercase tracking-wider">
              {dateString || "Loading Date..."}
            </div>
            <div className="text-sm font-semibold text-[var(--neon-purple)] uppercase tracking-widest mt-2 flex items-center justify-center gap-1">
              <Sparkles size={14} className="animate-pulse" />
              <span>{getGreeting()}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                Gmail Address
              </label>
              <div className="relative flex items-center">
                <Mail size={14} className="absolute left-3.5 text-muted/60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-elevated/45 border border-outline/40 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-[var(--neon-purple)]/50 focus:ring-1 focus:ring-[var(--neon-purple)]/30 transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock size={14} className="absolute left-3.5 text-muted/60" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-elevated/45 border border-outline/40 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-[var(--neon-purple)]/50 focus:ring-1 focus:ring-[var(--neon-purple)]/30 transition-all"
                />
              </div>
              <p className="text-[10px] text-muted mt-1.5 italic">
                Demo access: Any password will be authenticated.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/35 text-danger text-xs font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--neon-purple)] to-[var(--accent-light)] hover:brightness-110 text-white text-xs font-bold uppercase tracking-widest shadow-[0_4px_14px_0_var(--neon-purple-glow)] transition-all cursor-pointer active:scale-98"
            >
              Initialize Node
            </button>
          </form>

          {/* Theme toggler at bottom */}
          <div className="mt-6 pt-5 border-t border-outline/25 flex items-center justify-between">
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider">
              System Theme
            </span>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-elevated/25 border border-outline/25">
              <button
                onClick={() => handleThemeChange("dark")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  currentTheme === "dark"
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
                title="Dark mode"
              >
                <Moon size={12} />
              </button>
              <button
                onClick={() => handleThemeChange("light")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  currentTheme === "light"
                    ? "bg-white text-black shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
                title="Light mode"
              >
                <Sun size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Secure Node Footer */}
        <div className="text-center mt-6 text-[10px] text-muted font-semibold tracking-wider uppercase">
          SECURE SHIELD ACTIVE • NODE V4.2.1
        </div>
      </div>
    </div>
  );
}
