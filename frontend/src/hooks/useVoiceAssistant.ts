import { useState, useCallback, useRef, useEffect } from "react";
import axios from "axios";

const VOICE_SETTINGS_KEY = "voice_assistant_settings";

export interface VoiceSettings {
  enabled: boolean;
  autoSpeak: boolean;
  continuousMode: boolean;
}

function loadSettings(): VoiceSettings {
  try {
    const raw = localStorage.getItem(VOICE_SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as VoiceSettings;
  } catch {
    /* ignore */
  }
  return { enabled: true, autoSpeak: true, continuousMode: false };
}

function saveSettings(settings: VoiceSettings) {
  localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(settings));
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export function useVoiceAssistant(userEmail: string) {
  const [settings, setSettings] = useState<VoiceSettings>(loadSettings);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [geminiAvailable, setGeminiAvailable] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const onResultRef = useRef<((transcript: string, response: string, spoken: string) => void) | null>(null);

  const SpeechRecognitionCtor =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : undefined;

  useEffect(() => {
    axios.get("/api/voice/status").then((res) => {
      setGeminiAvailable(res.data.gemini_available);
    }).catch(() => setGeminiAvailable(false));
  }, []);

  const updateSettings = useCallback((partial: Partial<VoiceSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const speak = useCallback((text: string) => {
    if (!settings.autoSpeak || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [settings.autoSpeak]);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const processVoiceInput = useCallback(
    async (transcript: string) => {
      if (!transcript.trim()) return;
      setIsProcessing(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("user_email", userEmail);
        formData.append("message", transcript);

        const res = await axios.post("/api/voice/chat", formData);
        const { spoken_response, response } = res.data as {
          spoken_response: string;
          response: string;
        };

        onResultRef.current?.(transcript, response, spoken_response);
        speak(spoken_response || response);
      } catch (err: unknown) {
        const msg =
          axios.isAxiosError(err) && err.response?.data?.detail
            ? String(err.response.data.detail)
            : "Voice processing failed. Check backend and Gemini API key.";
        setError(msg);
      } finally {
        setIsProcessing(false);
      }
    },
    [userEmail, speak]
  );

  const startBrowserSTT = useCallback(() => {
    if (!SpeechRecognitionCtor) {
      setError("Speech recognition not supported in this browser. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = settings.continuousMode;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setInterimTranscript(interim || final);
      if (final.trim()) {
        setInterimTranscript(final.trim());
        recognition.stop();
        processVoiceInput(final.trim());
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        setError(`Microphone error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  }, [SpeechRecognitionCtor, settings.continuousMode, processVoiceInput]);

  const startMediaRecorderSTT = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setIsProcessing(true);
        setError(null);

        try {
          const formData = new FormData();
          formData.append("user_email", userEmail);
          formData.append("audio", blob, "recording.webm");

          const res = await axios.post("/api/voice/chat", formData);
          const { transcript, spoken_response, response } = res.data as {
            transcript: string;
            spoken_response: string;
            response: string;
          };

          setInterimTranscript(transcript);
          onResultRef.current?.(transcript, response, spoken_response);
          speak(spoken_response || response);
        } catch (err: unknown) {
          setError("Failed to process voice. Ensure GEMINI_API_KEY is set.");
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);
      setError(null);
    } catch {
      setError("Microphone access denied. Allow microphone permission and try again.");
    }
  }, [userEmail, speak]);

  const startListening = useCallback(
    (onResult?: (transcript: string, response: string, spoken: string) => void) => {
      if (!settings.enabled) return;
      onResultRef.current = onResult ?? null;

      if (SpeechRecognitionCtor) {
        startBrowserSTT();
      } else if (geminiAvailable) {
        startMediaRecorderSTT();
      } else {
        setError("Voice requires Chrome/Edge or a configured Gemini API key.");
      }
    },
    [settings.enabled, SpeechRecognitionCtor, geminiAvailable, startBrowserSTT, startMediaRecorderSTT]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(
    (onResult?: (transcript: string, response: string, spoken: string) => void) => {
      if (isListening) stopListening();
      else startListening(onResult);
    },
    [isListening, startListening, stopListening]
  );

  return {
    settings,
    updateSettings,
    isListening,
    isProcessing,
    isSpeaking,
    interimTranscript,
    error,
    geminiAvailable,
    speechSupported: !!SpeechRecognitionCtor,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    processVoiceInput,
  };
}
