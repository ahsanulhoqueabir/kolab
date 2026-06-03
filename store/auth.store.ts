import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api_client } from "@/lib/api/api-client";
import type {
  AuthUser,
  LoginParams,
  SignUpParams,
} from "@/types/business/user.types";

// ─── State Shape ───────────────────────────────────────────────────────────

export interface AuthState {
  /** Authenticated user profile */
  user: AuthUser | null;
  /** JWT access token */
  accessToken: string | null;
  /** Whether the store has rehydrated from storage */
  hasHydrated: boolean;
  /** Whether an auth operation is in flight */
  isProcessing: boolean;
  /** Last error message, if any */
  error: string | null;
}

interface AuthActions {
  /** Login with email & password */
  login: (params: LoginParams) => Promise<void>;
  /** Sign up a new account */
  signUp: (params: SignUpParams) => Promise<void>;
  /** Logout — clears persisted state */
  logout: () => void;
  /** Re-initialise auth from stored token (e.g. on page refresh) */
  initAuth: () => Promise<void>;
  /** Set hydration flag (called by persist onRehydrate) */
  setHasHydrated: (value: boolean) => void;
  /** Clear any error */
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

// ─── Defaults ──────────────────────────────────────────────────────────────

const initialState: AuthState = {
  user: null,
  accessToken: null,
  hasHydrated: false,
  isProcessing: false,
  error: null,
};

// ─── Store ─────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      /* ── State ──────────────────────────────────────────────────── */
      ...initialState,

      /* ── Hydration ──────────────────────────────────────────────── */
      setHasHydrated: (value) => set({ hasHydrated: value }),

      /* ── Login ──────────────────────────────────────────────────── */
      login: async (params) => {
        set({ isProcessing: true, error: null });

        try {
          const { data } = await api_client.post("/auth/login", params);
          const { user, token } = data.data;

          set({
            user,
            accessToken: token,
            isProcessing: false,
            error: null,
          });
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { error?: string } } })?.response
              ?.data?.error ||
            (err as Error).message ||
            "Login failed";
          set({ isProcessing: false, error: message });
          throw new Error(message);
        }
      },

      /* ── Sign Up ────────────────────────────────────────────────── */
      signUp: async (params) => {
        set({ isProcessing: true, error: null });

        try {
          const { data } = await api_client.post("/auth/signup", params);
          const { user, token } = data.data;

          set({
            user,
            accessToken: token,
            isProcessing: false,
            error: null,
          });
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { error?: string } } })?.response
              ?.data?.error ||
            (err as Error).message ||
            "Sign up failed";
          set({ isProcessing: false, error: message });
          throw new Error(message);
        }
      },

      /* ── Logout ─────────────────────────────────────────────────── */
      logout: () => {
        set({ ...initialState, hasHydrated: get().hasHydrated });
      },

      /* ── Init Auth (re-validate stored token) ───────────────────── */
      initAuth: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          set({ user: null, accessToken: null });
          return;
        }

        try {
          const { data } = await api_client.get("/auth/me");
          set({ user: data.data.user, error: null });
        } catch {
          // Token invalid/expired — clear everything
          set({ ...initialState, hasHydrated: get().hasHydrated });
        }
      },

      /* ── Clear Error ────────────────────────────────────────────── */
      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    },
  ),
);

// ─── Derived helpers ───────────────────────────────────────────────────────

/** Convenience selector – true when a non-null user & token exist */
export const selectIsAuthenticated = (s: AuthStore) =>
  s.user !== null && s.accessToken !== null;
