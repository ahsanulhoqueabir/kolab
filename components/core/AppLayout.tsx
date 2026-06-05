"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/core/Sidebar";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Main application layout with sidebar navigation.
 * Wraps authenticated pages.
 */
export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleToggle = React.useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const handleMobileToggle = React.useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const handleMobileClose = React.useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onToggle={handleToggle}
        onMobileToggle={handleMobileToggle}
        onMobileClose={handleMobileClose}
      />
      {/* Mobile overlay when sidebar is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={handleMobileClose}
        />
      )}
      <main className="flex-1 overflow-y-auto bg-background">
        {/* Mobile header — visible on mobile only */}
        <div className="flex items-center justify-between h-14 px-4 bg-background border-b lg:hidden sticky top-0 z-30">
          <div className="flex items-center gap-2">
            {!mobileOpen && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleMobileToggle}
                className="text-foreground"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <img src="/kolab.png" alt="Kolab Logo" className="h-6 w-auto" />
            <span className="font-bold text-lg">Kolab</span>
          </div>
        </div>
        <div className="p-4 md:p-6 lg:p-8 mx-auto">{children}</div>
      </main>
    </div>
  );
}
