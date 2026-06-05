"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { PAGE_TO_RESOURCE_PERMISSION_MAP } from "@/config/permission.config";

interface PageAccessGuardProps {
  pageUrl: string;
  children: React.ReactNode;
  /** If true, redirect to landing page instead of showing nothing */
  redirectOnDeny?: boolean;
}

/**
 * PageAccessGuard — checks whether the current user's role grants access
 * to the given `pageUrl`.
 *
 * Access is determined by two checks:
 * 1. The user's `pages` list must include the `pageUrl` (page-level permission)
 * 2. OR the user's `permissions` must include at least one resource permission
 *    required by this page (from PAGE_TO_RESOURCE_PERMISSION_MAP)
 *
 * Usage:
 * ```tsx
 * <PageAccessGuard pageUrl="/projects">
 *   <ProjectsPage />
 * </PageAccessGuard>
 * ```
 */
export function PageAccessGuard({
  pageUrl,
  children,
  redirectOnDeny = true,
}: PageAccessGuardProps) {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const pages = useAuthStore((s) => s.pages);
  const permissions = useAuthStore((s) => s.permissions);
  const user = useAuthStore((s) => s.user);
  const landingPage = useAuthStore((s) => s.landingPage);

  const hasAccess = React.useMemo(() => {
    // Check 1: Direct page-level access
    if (pages.includes(pageUrl)) return true;

    // Check 2: Resource permission-based access
    const requiredPermissions = PAGE_TO_RESOURCE_PERMISSION_MAP[pageUrl];
    if (requiredPermissions) {
      return requiredPermissions.some((perm) => permissions.includes(perm));
    }

    return false;
  }, [pages, permissions, pageUrl]);

  React.useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!hasAccess && redirectOnDeny) {
      // Redirect to role's landing page, or first available page
      const target = landingPage || pages[0] || "/dashboard";
      router.push(target);
    }
  }, [
    hasHydrated,
    user,
    hasAccess,
    redirectOnDeny,
    router,
    pages,
    landingPage,
  ]);

  // Not hydrated yet — show nothing
  if (!hasHydrated || !user) return null;

  // No access and not redirecting — show nothing
  if (!hasAccess) return null;

  return <>{children}</>;
}
