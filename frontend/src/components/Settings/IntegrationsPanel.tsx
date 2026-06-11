import React from "react";
import {
  Calendar,
  Mail,
  Sparkles,
  Link2,
  Unlink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { useIntegrations } from "../../hooks/useIntegrations";

interface IntegrationsPanelProps {
  userEmail: string;
}

export function IntegrationsPanel({ userEmail }: IntegrationsPanelProps) {
  const { status, loading, error, connectGoogle, disconnectGoogle, fetchStatus } =
    useIntegrations(userEmail);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">Integrations & API Keys</h2>
        <p className="text-xs text-muted">
          Connect Google Calendar, Gmail, and configure Gemini AI via backend <code className="text-[10px] bg-elevated px-1 rounded">.env</code> file.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Gemini AI */}
      <div className="rounded-2xl border border-outline/25 bg-surface/40 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-[var(--neon-purple)]/20 flex items-center justify-center">
            <Sparkles size={18} className="text-[var(--neon-purple)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Gemini AI</h3>
            <p className="text-[10px] text-muted">Voice chat & intelligent responses</p>
          </div>
          {loading ? (
            <Loader2 size={16} className="animate-spin text-muted" />
          ) : status?.gemini_connected ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
              <CheckCircle2 size={12} /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg">
              <AlertCircle size={12} /> Not configured
            </span>
          )}
        </div>
        <div className="text-xs text-muted bg-elevated/30 rounded-lg p-3 border border-outline/15">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound size={12} />
            <span className="font-semibold text-foreground/80">Setup</span>
          </div>
          Add <code className="text-[10px]">GEMINI_API_KEY=your_key</code> to the project <code className="text-[10px]">.env</code> file and restart the backend.
          {status?.gemini_model && (
            <p className="mt-1">Model: <span className="text-foreground/70">{status.gemini_model}</span></p>
          )}
        </div>
      </div>

      {/* Google Calendar + Gmail */}
      <div className="rounded-2xl border border-outline/25 bg-surface/40 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Calendar size={18} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Google Calendar & Gmail</h3>
            <p className="text-[10px] text-muted">OAuth connection for live calendar and email</p>
          </div>
          {status?.google_connected ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
              <CheckCircle2 size={12} /> Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-muted bg-elevated/50 px-2 py-1 rounded-lg">
              Disconnected
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-elevated/30 border border-outline/15">
            <Calendar size={12} className={status?.google_calendar_connected ? "text-emerald-400" : "text-muted"} />
            <span>Calendar {status?.google_calendar_connected ? "✓" : "—"}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-elevated/30 border border-outline/15">
            <Mail size={12} className={status?.gmail_connected ? "text-emerald-400" : "text-muted"} />
            <span>Gmail {status?.gmail_connected ? "✓" : "—"}</span>
          </div>
        </div>

        {!status?.google_configured && (
          <div className="text-xs text-amber-400/90 bg-amber-400/5 border border-amber-400/15 rounded-lg p-3">
            Set <code className="text-[10px]">GOOGLE_CLIENT_ID</code> and <code className="text-[10px]">GOOGLE_CLIENT_SECRET</code> in <code className="text-[10px]">.env</code> first.
          </div>
        )}

        <div className="flex gap-2">
          {status?.google_connected ? (
            <button
              onClick={disconnectGoogle}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-all cursor-pointer"
            >
              <Unlink size={14} />
              Disconnect Google
            </button>
          ) : (
            <button
              onClick={connectGoogle}
              disabled={!status?.google_configured}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[var(--neon-purple)] to-[var(--accent-light)] text-white hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <Link2 size={14} />
              Connect Google Account
            </button>
          )}
          <button
            onClick={fetchStatus}
            className="px-3 py-2 rounded-xl text-xs text-muted border border-outline/25 hover:text-foreground hover:bg-elevated/40 transition-all cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {status?.token_expiry && (
          <p className="text-[10px] text-muted">Token expires: {new Date(status.token_expiry).toLocaleString()}</p>
        )}
      </div>

      <div className="rounded-xl border border-outline/15 bg-elevated/20 p-4 text-[10px] text-muted leading-relaxed">
        <p className="font-semibold text-foreground/70 mb-2">How to get API keys</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Gemini: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-[var(--neon-purple)] hover:underline">Google AI Studio</a></li>
          <li>Google OAuth: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-[var(--neon-purple)] hover:underline">Google Cloud Console</a></li>
          <li>Enable Calendar API + Gmail API in your Google Cloud project</li>
          <li>Add redirect URI: <code>http://localhost:8000/api/oauth/google/callback</code></li>
        </ol>
      </div>
    </div>
  );
}
