import React from "react";
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";

interface VoiceAssistantBarProps {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  interimTranscript: string;
  error: string | null;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onStopSpeaking: () => void;
}

export function VoiceAssistantBar({
  isListening,
  isProcessing,
  isSpeaking,
  interimTranscript,
  error,
  voiceEnabled,
  onToggleVoice,
  onStopSpeaking,
}: VoiceAssistantBarProps) {
  if (!voiceEnabled && !isListening && !isProcessing) return null;

  return (
    <div className="max-w-3xl mx-auto w-full px-4 mb-2">
      <div
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
          isListening
            ? "bg-[var(--neon-purple)]/10 border-[var(--neon-purple)]/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
            : isProcessing
            ? "bg-blue-500/10 border-blue-500/30"
            : isSpeaking
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-surface/40 border-outline/25"
        }`}
      >
        <button
          onClick={onToggleVoice}
          disabled={isProcessing}
          className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all cursor-pointer ${
            isListening
              ? "bg-danger/20 text-danger border border-danger/30 animate-pulse"
              : "bg-[var(--neon-purple)]/20 text-[var(--neon-purple)] border border-[var(--neon-purple)]/30 hover:bg-[var(--neon-purple)]/30"
          }`}
          title={isListening ? "Stop listening" : "Start voice assistant"}
        >
          {isProcessing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isListening ? (
            <MicOff size={16} />
          ) : (
            <Mic size={16} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {error ? (
            <p className="text-xs text-danger truncate">{error}</p>
          ) : isListening ? (
            <p className="text-xs text-[var(--neon-purple)] font-medium">
              Listening… {interimTranscript && <span className="text-foreground/70">"{interimTranscript}"</span>}
            </p>
          ) : isProcessing ? (
            <p className="text-xs text-blue-400 font-medium">Processing with Gemini…</p>
          ) : isSpeaking ? (
            <p className="text-xs text-emerald-400 font-medium">Speaking response…</p>
          ) : (
            <p className="text-xs text-muted">Voice assistant ready — tap mic to speak</p>
          )}
        </div>

        {isSpeaking && (
          <button
            onClick={onStopSpeaking}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-elevated/40 transition-all cursor-pointer"
            title="Stop speaking"
          >
            <VolumeX size={14} />
          </button>
        )}
        {!isSpeaking && voiceEnabled && (
          <Volume2 size={14} className="text-muted/50" />
        )}
      </div>
    </div>
  );
}
