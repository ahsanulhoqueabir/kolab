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

export interface StoredAccount {
  user: AuthUser;
  accessToken: string;
  permissions: string[];
  pages: string[];
  landingPage: string | null;
}

/** Maximum number of stored accounts allowed */
const MAX_ACCOUNTS = 10;

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
  /** Stored accounts for multi-account support */
  accounts: StoredAccount[];
}

interface AuthActions {
  /** Login with email & password */
  login: (params: LoginParams) => Promise<void>;
  /** Sign up a new account */
  signUp: (params: SignUpParams) => Promise<void>;
  /** Logout — clears persisted state */
  logout: () => void;
  /** Logout current active account and optionally switch to next user */
  logoutCurrent: (nextUserId?: string) => void;
  /** Switch active account context to selected user ID */
  switchAccount: (userId: string) => Promise<void>;
  /** Re-initialise auth from stored token (e.g. on page refresh or account switch) */
  initAuth: (token?: string) => Promise<void>;
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
  accounts: [],
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

          // Save previous active account to accounts list before switching
          const prevState = get();
          const updatedAccounts = [...prevState.accounts];
          if (prevState.user && prevState.accessToken) {
            const existsIdx = updatedAccounts.findIndex(
              (acc) => acc.user.id === prevState.user!.id,
            );
            const oldSession: StoredAccount = {
              user: prevState.user,
              accessToken: prevState.accessToken,
              permissions: prevState.permissions,
              pages: prevState.pages,
              landingPage: prevState.landingPage,
            };
            if (existsIdx >= 0) {
              updatedAccounts[existsIdx] = oldSession;
            } else {
              updatedAccounts.push(oldSession);
            }
          }

          set({
            user,
            accessToken: token,
            accounts: updatedAccounts,
            isProcessing: false,
            error: null,
          });

          // Fetch permissions & pages from /auth/me
          await get().initAuth(token);
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

          // Save previous active account to accounts list before switching
          const prevState = get();
          const updatedAccounts = [...prevState.accounts];
          if (prevState.user && prevState.accessToken) {
            const existsIdx = updatedAccounts.findIndex(
              (acc) => acc.user.id === prevState.user!.id,
            );
            const oldSession: StoredAccount = {
              user: prevState.user,
              accessToken: prevState.accessToken,
              permissions: prevState.permissions,
              pages: prevState.pages,
              landingPage: prevState.landingPage,
            };
            if (existsIdx >= 0) {
              updatedAccounts[existsIdx] = oldSession;
            } else {
              updatedAccounts.push(oldSession);
            }
          }

          set({
            user,
            accessToken: token,
            accounts: updatedAccounts,
            isProcessing: false,
            error: null,
          });

          // Fetch permissions & pages from /auth/me
          await get().initAuth(token);
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
          accounts: [],
        });
      },

      /* ── Logout Current ─────────────────────────────────────────── */
      logoutCurrent: (nextUserId?: string) => {
        const { user, accounts } = get();
        if (!user) return;

        const remainingAccounts = accounts.filter(
          (acc) => acc.user.id !== user.id,
        );

        if (remainingAccounts.length === 0) {
          // No other accounts left, do a full logout
          set({
            ...initialState,
            permissions: [],
            pages: [],
            landingPage: null,
            hasHydrated: get().hasHydrated,
            accounts: [],
          });
          window.location.href = "/login";
          return;
        }

        // Determine which account to switch to
        let targetAccount = remainingAccounts[0];
        if (nextUserId) {
          const found = remainingAccounts.find(
            (acc) => acc.user.id === nextUserId,
          );
          if (found) targetAccount = found;
        }

        set({
          user: targetAccount.user,
          accessToken: targetAccount.accessToken,
          permissions: targetAccount.permissions,
          pages: targetAccount.pages,
          landingPage: targetAccount.landingPage,
          accounts: remainingAccounts,
        });

        window.location.href = targetAccount.landingPage || "/dashboard";
      },

      /* ── Switch Account ─────────────────────────────────────────── */
      switchAccount: async (userId) => {
        const currentActive = get();

        // Find the target account from stored accounts
        const targetAccount = currentActive.accounts.find(
          (acc) => acc.user.id === userId,
        );
        if (!targetAccount) return;

        // Set token first so initAuth can use it
        set({
          accessToken: targetAccount.accessToken,
          isProcessing: true,
          error: null,
        });

        try {
          // initAuth() now handles:
          //   1. Saving the current active user to accounts (if different)
          //   2. Upserting the new user in accounts
          //   3. Fetching fresh profile/permissions from /api/auth/me
          await get().initAuth(targetAccount.accessToken);
        } catch (err) {
          set({ isProcessing: false, error: (err as Error).message });
          throw err;
        }

        set({ isProcessing: false });

        window.location.href = targetAccount.landingPage || "/dashboard";
      },

      /* ── Init Auth (re-validate stored token) ───────────────────── */
      initAuth: async (token?: string) => {
        if (token) {
          set({ accessToken: token });
        }
        const accessToken = token || get().accessToken;
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
            roleName: roleData?.name ?? "",
            permissions: (profile.permissions ?? []) as string[],
            pages: (profile.pages ?? []) as string[],
          };

          // Update accounts list with the newly active user session
          // BUT: if the current user.id already matches, don't re-add —
          // just update the active state fields. The accounts list should
          // only be touched when we are switching between different users.
          const currentState = get();
          const currentAccounts = currentState.accounts;

          // Only update accounts list if the user actually changed
          // (i.e. this is a switch, not just a refresh of the same user)
          const isSameUser = currentState.user?.id === user.id;

          if (!isSameUser) {
            // Save the previous active user to accounts before switching
            const updatedAccounts = [...currentAccounts];
            if (currentState.user && currentState.accessToken) {
              const prevSession: StoredAccount = {
                user: currentState.user,
                accessToken: currentState.accessToken,
                permissions: currentState.permissions,
                pages: currentState.pages,
                landingPage: currentState.landingPage,
              };
              const existsPrevIdx = updatedAccounts.findIndex(
                (acc) => acc.user.id === currentState.user!.id,
              );
              if (existsPrevIdx >= 0) {
                updatedAccounts[existsPrevIdx] = prevSession;
              } else {
                updatedAccounts.push(prevSession);
              }
            }

            // Upsert the new user in accounts
            const existsIdx = updatedAccounts.findIndex(
              (acc) => acc.user.id === user.id,
            );
            const newSession: StoredAccount = {
              user,
              accessToken: accessToken,
              permissions: (profile.permissions ?? []) as string[],
              pages: (profile.pages ?? []) as string[],
              landingPage: (roleData?.landing_page as string) || null,
            };
            if (existsIdx >= 0) {
              updatedAccounts[existsIdx] = newSession;
            } else {
              updatedAccounts.push(newSession);
            }

            set({
              user,
              permissions: (profile.permissions ?? []) as string[],
              pages: (profile.pages ?? []) as string[],
              landingPage: (roleData?.landing_page as string) || null,
              accounts: updatedAccounts,
              error: null,
            });
          } else {
            // Same user — just refresh the active state, don't touch accounts.
            // But do a light cleanup: remove any duplicate entries for this user
            // and enforce the max accounts limit.
            const currentAccounts = get().accounts;
            const deduped = currentAccounts.filter(
              (acc, idx, self) =>
                acc.user.id !== user.id ||
                idx === self.findIndex((a) => a.user.id === user.id),
            );
            const trimmed = deduped.slice(0, MAX_ACCOUNTS - 1);

            set({
              user,
              permissions: (profile.permissions ?? []) as string[],
              pages: (profile.pages ?? []) as string[],
              landingPage: (roleData?.landing_page as string) || null,
              accounts: trimmed,
              error: null,
            });
          }
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

          // If the account is inactive — remove it from accounts and
          // switch to another account if available
          if (errorType === "PROFILE_INACTIVE") {
            const stateBeforeError = get();
            const remainingAccounts = stateBeforeError.accounts.filter(
              (acc) => acc.user.id !== stateBeforeError.user?.id,
            );
            if (remainingAccounts.length > 0) {
              const nextAccount = remainingAccounts[0];
              set({
                user: nextAccount.user,
                accessToken: nextAccount.accessToken,
                permissions: nextAccount.permissions,
                pages: nextAccount.pages,
                landingPage: nextAccount.landingPage,
                accounts: remainingAccounts,
                hasHydrated: get().hasHydrated,
                isProcessing: false,
                error: errorMessage || "Account is inactive or suspended",
              });
              return;
            }
            // No other accounts — full reset with error
            set({
              ...initialState,
              hasHydrated: get().hasHydrated,
              error: errorMessage || "Account is inactive or suspended",
            });
            return;
          }

          // Token invalid/expired — clear only the current user session
          // but preserve other accounts if this is a multi-account scenario
          const stateBeforeError = get();
          if (stateBeforeError.accounts.length > 0) {
            // Remove only the failed account from accounts
            const remainingAccounts = stateBeforeError.accounts.filter(
              (acc) => acc.user.id !== stateBeforeError.user?.id,
            );
            if (remainingAccounts.length > 0) {
              // Switch to the first remaining account
              const nextAccount = remainingAccounts[0];
              set({
                user: nextAccount.user,
                accessToken: nextAccount.accessToken,
                permissions: nextAccount.permissions,
                pages: nextAccount.pages,
                landingPage: nextAccount.landingPage,
                accounts: remainingAccounts,
                hasHydrated: get().hasHydrated,
                isProcessing: false,
                error: null,
              });
              return;
            }
          }

          // No other accounts — full reset
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
        accounts: state.accounts,
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
