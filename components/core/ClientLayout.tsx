"use client";

import { usePathname } from "next/navigation";
import { AppLayout } from "@/components/core/AppLayout";
import { ThemeProvider } from "@/components/core/ThemeProvider";

/** Pages that should NOT show the sidebar (auth pages, landing, etc.) */
const PUBLIC_PATHS = ["/login", "/signup"];

interface ClientLayoutProps {
  children: React.ReactNode;
}

/**
 * Client-side layout wrapper that decides whether to render
 * the sidebar shell or just the bare children (public pages).
 */
export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isPublicPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  return (
    <ThemeProvider>
      {isPublicPage ? children : <AppLayout>{children}</AppLayout>}
    </ThemeProvider>
  );
}
