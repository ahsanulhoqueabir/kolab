"use client";

import * as React from "react";
import { Sidebar } from "@/components/core/Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Main application layout with sidebar navigation.
 * Wraps authenticated pages.
 */
export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
