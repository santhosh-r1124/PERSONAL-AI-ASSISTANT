import { useState, useCallback, useEffect } from "react";
import axios from "axios";

export interface IntegrationStatus {
  google_configured: boolean;
  google_connected: boolean;
  gmail_connected: boolean;
  google_calendar_connected: boolean;
  gemini_connected: boolean;
  gemini_model: string;
  token_expiry: string | null;
}

export function useIntegrations(userEmail: string) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/integrations/status", {
        params: { user_email: userEmail },
      });
      setStatus(res.data as IntegrationStatus);
    } catch {
      setError("Could not load integration status");
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const connectGoogle = useCallback(async () => {
    try {
      const res = await axios.get("/api/oauth/google/authorize", {
        params: { user_email: userEmail },
      });
      const url = res.data.authorization_url as string;
      window.location.href = url;
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? String(err.response.data.detail)
          : "Failed to start Google OAuth";
      setError(msg);
    }
  }, [userEmail]);

  const disconnectGoogle = useCallback(async () => {
    try {
      await axios.post("/api/integrations/google/disconnect", null, {
        params: { user_email: userEmail },
      });
      await fetchStatus();
    } catch {
      setError("Failed to disconnect Google");
    }
  }, [userEmail, fetchStatus]);

  return {
    status,
    loading,
    error,
    fetchStatus,
    connectGoogle,
    disconnectGoogle,
  };
}
