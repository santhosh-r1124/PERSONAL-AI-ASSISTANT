import { useState, useEffect } from "react";
import { getTheme, setTheme, themes, applyTheme } from "./theme";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem("theme") || "dark";
    return saved;
  });

  // Initialize theme on mount
  useEffect(() => {
    if (!localStorage.getItem("theme")) {
      setTheme("dark");
      applyTheme(themes.dark);
    } else {
      applyTheme(getTheme());
    }
  }, []);

  const validateGmail = (email) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    return gmailRegex.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your Gmail address");
      return;
    }

    if (!validateGmail(email)) {
      setError("Please enter a valid Gmail address (e.g., yourname@gmail.com)");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    // Accept any password for demo purposes
    onLogin(email.trim());
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getTimeString = () => {
    return new Date().toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getDateString = () => {
    return new Date().toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-accent flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">⚡</span>
            </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Task Automation
          </h1>
          <p className="text-muted text-sm">
            Intelligent task management powered by AI
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface rounded-2xl border border-outline/40 shadow-2xl p-8">
          {/* Time & Greeting */}
          <div className="text-center mb-6 pb-6 border-b border-outline/30">
            <div className="text-5xl font-light mb-2 cyberpunk-time font-mono">
              {getTimeString()}
            </div>
            <div className="text-sm text-muted mb-1">{getDateString()}</div>
            <div className="text-lg font-medium text-foreground mt-2">
              {getGreeting()}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Gmail Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full bg-elevated/60 border border-outline/50 rounded-lg px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-grey-500/50 focus:border-grey-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter any password"
                className="w-full bg-elevated/60 border border-outline/50 rounded-lg px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-grey-500/50 focus:border-grey-500"
              />
              <p className="text-xs text-muted mt-1.5">
                Demo mode: Any password is accepted
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/40 text-danger/90 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-grey-700 text-white text-sm font-semibold shadow-lg"
            >
              Sign In
            </button>
          </form>

          {/* Theme Switcher */}
          <div className="mt-6 pt-6 border-t border-outline/30">
            <div className="text-xs text-muted uppercase tracking-wide font-semibold mb-3 text-center">
              Theme
            </div>
            <div className="flex items-center justify-center gap-2">
              {Object.keys(themes).map((themeName) => (
                <button
                  key={themeName}
                  onClick={() => {
                    setCurrentTheme(themeName);
                    setTheme(themeName);
                    applyTheme(themes[themeName]);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                    currentTheme === themeName
                      ? "bg-grey-700 text-white shadow-md"
                      : "text-muted hover:text-foreground hover:bg-elevated/40"
                  }`}
                  title={`Switch to ${themes[themeName].name} theme`}
                >
                  {themes[themeName].name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-muted">
          <p>Secure • Private • Intelligent</p>
        </div>
      </div>
    </div>
  );
}

export default Login;

