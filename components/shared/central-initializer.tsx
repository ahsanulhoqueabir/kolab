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

    const storedUser = useAuthStore.getState().user;
    const storedToken = useAuthStore.getState().accessToken;

    // Only call initAuth if we have a persisted token to validate
    if (storedToken && storedUser) {
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
