"use client";

import { useEffect, useRef } from "react";
import { useAuthStore, selectIsAuthenticated } from "@/store/auth.store";

/**
 * CentralDataInitializer — re-validates the stored auth token on mount.
 *
 * On every client-side navigation it checks whether a persisted token
 * is still valid by calling `initAuth()` (which hits `GET /api/auth/me`).
 * If the token is expired the store is cleared and the user is treated
 * as logged-out.
 *
 * Place this component once in your root layout, inside `<body>`.
 */
export function CentralDataInitializer() {
  const hasInitialized = useRef(false);

  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    if (!hasHydrated || hasInitialized.current) return;

    hasInitialized.current = true;

    const state = useAuthStore.getState();
    const storedToken = state.accessToken;

    // If there's a persisted token, validate it via /api/auth/me.
    // Also init if there are stored accounts (multi-account scenario)
    // even if the current token seems missing — the accounts list
    // may contain valid sessions we can fall back to.
    if (storedToken || state.accounts.length > 0) {
      initAuth();
    }
  }, [hasHydrated, initAuth]);

  return null;
}

/**
 * AuthGate — renders children only after auth has been validated.
 * Useful for wrapping parts of the UI that depend on auth state.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = selectIsAuthenticated(useAuthStore.getState());

  if (!hasHydrated) {
    return null; // or a minimal skeleton
  }

  if (!isAuthenticated) {
    return null; // or a redirect to /login handled by middleware
  }

  return <>{children}</>;
}
