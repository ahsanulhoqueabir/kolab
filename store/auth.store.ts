import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api_client } from "@/lib/api/api-client";
import type {
  AuthUser,
  LoginParams,
  SignUpParams,
} from "@/types/business/user.types";
import type { ApiResponse } from "@/lib/api/api-response";

// ─── State Shape ───────────────────────────────────────────────────────────

export interface AuthState {
  /** Authenticated user profile */
  user: AuthUser | null;
  /** JWT access token */
  accessToken: string | null;
  /** Flat list of permission strings (e.g. "project:read:all") */
  permissions: string[];
  /** Flat list of accessible page URLs (e.g. "/projects") */
  pages: string[];
  /** User's role landing page — redirect here after login / at root */
  landingPage: string | null;
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
  permissions: [],
  pages: [],
  landingPage: null,
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

          // Set user + token first, then fetch full profile with permissions
          set({
            user,
            accessToken: token,
            isProcessing: false,
            error: null,
          });

          // Fetch permissions & pages from /auth/me
          // Use direct fetch instead of api_client to avoid interceptor loops
          await get().initAuth();
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

          // Set user + token first, then fetch full profile with permissions
          set({
            user,
            accessToken: token,
            isProcessing: false,
            error: null,
          });

          // Fetch permissions & pages from /auth/me
          await get().initAuth();
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
        set({
          ...initialState,
          permissions: [],
          pages: [],
          landingPage: null,
          hasHydrated: get().hasHydrated,
        });
      },

      /* ── Init Auth (re-validate stored token) ───────────────────── */
      initAuth: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          set({
            user: null,
            accessToken: null,
            permissions: [],
            pages: [],
            landingPage: null,
          });
          return;
        }

        try {
          // Use fetch() directly instead of api_client to avoid the
          // response interceptor that could cause an infinite loop
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const json: ApiResponse = await res.json();

          if (!json.success || !json.data) {
            throw new Error(json.error || "Failed to fetch profile");
          }

          const profile = json.data as Record<string, unknown>;

          // Build AuthUser from profile data
          const roleData = profile.role as
            | { id?: string; name?: string; landing_page?: string }
            | undefined;
          const user: AuthUser = {
            id: profile.id as string,
            email: profile.email as string,
            name: profile.name as string,
            phone: (profile.phone as string) || null,
            image: (profile.image as string) || null,
            role:
              typeof profile.role === "string"
                ? (profile.role as string)
                : (roleData?.id ?? ""),
            permissions: (profile.permissions ?? []) as string[],
            pages: (profile.pages ?? []) as string[],
          };

          set({
            user,
            permissions: (profile.permissions ?? []) as string[],
            pages: (profile.pages ?? []) as string[],
            landingPage: (roleData?.landing_page as string) || null,
            error: null,
          });
        } catch (err: unknown) {
          // Try to extract errorType from the failed response
          let errorType: string | undefined;
          let errorMessage: string | undefined;

          if (err instanceof Response) {
            try {
              const json = await err.json();
              errorType = json.errorType;
              errorMessage = json.error;
            } catch {
              // ignore
            }
          } else if (err && typeof err === "object" && "response" in err) {
            const axiosErr = err as {
              response?: { data?: { errorType?: string; error?: string } };
            };
            errorType = axiosErr.response?.data?.errorType;
            errorMessage = axiosErr.response?.data?.error;
          } else if (err instanceof Error) {
            errorMessage = err.message;
          }

          // If the account is inactive, logout and show the specific error
          if (errorType === "PROFILE_INACTIVE") {
            set({
              ...initialState,
              hasHydrated: get().hasHydrated,
              error: errorMessage || "Account is inactive or suspended",
            });
            return;
          }

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
        permissions: state.permissions,
        pages: state.pages,
        landingPage: state.landingPage,
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

/**
 * Check if the current user has a specific permission string.
 * @example selectHasPermission(store, "project:create")
 * @example selectHasPermission(store, "task:read:all")
 */
export const selectHasPermission = (s: AuthStore, permission: string) =>
  s.permissions.includes(permission);

/**
 * Check if the current user has access to a specific page URL.
 * @example selectHasPageAccess(store, "/projects")
 * @example selectHasPageAccess(store, "/tasks/create")
 */
export const selectHasPageAccess = (s: AuthStore, pageUrl: string) =>
  s.pages.includes(pageUrl);
