"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore, selectIsAuthenticated } from "@/store/auth.store";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => selectIsAuthenticated(s));
  const landingPage = useAuthStore((s) => s.landingPage);

  // ── Redirect logic ──
  useEffect(() => {
    if (!hasHydrated) return;

    if (isAuthenticated) {
      // Authenticated → returnTo (if present) or landing page or dashboard
      const returnTo = searchParams.get("returnTo");
      router.replace(returnTo || landingPage || "/dashboard");
    } else {
      // Unauthenticated → login page
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, landingPage, router, searchParams]);

  // Don't flash anything while checking auth
  return null;
}
