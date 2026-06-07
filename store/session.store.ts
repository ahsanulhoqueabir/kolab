import { create } from "zustand";
import { api_client } from "@/lib/api/api-client";
import { useAuthStore } from "@/store/auth.store";
import type { AuthSession } from "@/types/db/auth-session.types";

// ─── Types ───────────────────────────────────────────────────────────────

interface SessionState {
  /** List of active auth sessions */
  sessions: AuthSession[];
  /** Whether sessions are being loaded */
  isLoading: boolean;
  /** Whether an operation is in flight */
  isProcessing: boolean;
  /** Last error message */
  error: string | null;
}

interface SessionActions {
  /** Fetch all active sessions for the current user */
  fetchSessions: () => Promise<void>;
  /** Revoke a specific session by ID */
  revokeSession: (sessionId: string) => Promise<void>;
  /** Revoke all sessions except the current one */
  revokeAllOtherSessions: () => Promise<void>;
}

type SessionStore = SessionState & SessionActions;

// ─── Defaults ────────────────────────────────────────────────────────────

const initialState: SessionState = {
  sessions: [],
  isLoading: false,
  isProcessing: false,
  error: null,
};

// ─── Store ───────────────────────────────────────────────────────────────

export const useSessionStore = create<SessionStore>((set, get) => ({
  ...initialState,

  fetchSessions: async () => {
    set({ isLoading: true, error: null });

    try {
      const res = await api_client.get("/auth/sessions");
      const data = res.data as {
        success: boolean;
        data?: AuthSession[];
        error?: string;
      };

      if (data.success && data.data) {
        set({ sessions: data.data, isLoading: false });
      } else {
        set({
          error: data.error || "Failed to load sessions",
          isLoading: false,
        });
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to load sessions";
      set({ error: message, isLoading: false });
    }
  },

  revokeSession: async (sessionId: string) => {
    set({ isProcessing: true, error: null });

    try {
      const res = await api_client.delete(`/auth/sessions?id=${sessionId}`);
      const data = res.data as { success: boolean; error?: string };

      if (data.success) {
        // Remove the revoked session from local state
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          isProcessing: false,
        }));
      } else {
        set({
          error: data.error || "Failed to revoke session",
          isProcessing: false,
        });
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to revoke session";
      set({ error: message, isProcessing: false });
    }
  },

  revokeAllOtherSessions: async () => {
    set({ isProcessing: true, error: null });

    try {
      const res = await api_client.delete("/auth/sessions?revoke_others=true");
      const data = res.data as { success: boolean; error?: string };

      if (data.success) {
        // Keep only the current session
        const currentSessionId = useAuthStore.getState().user?.currentSessionId;
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id === currentSessionId),
          isProcessing: false,
        }));
      } else {
        set({
          error: data.error || "Failed to revoke other sessions",
          isProcessing: false,
        });
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to revoke other sessions";
      set({ error: message, isProcessing: false });
    }
  },
}));
