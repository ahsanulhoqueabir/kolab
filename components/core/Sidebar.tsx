"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Menu,
  LogOut,
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Users,
  Activity,
  Shield,
  UserCog,
  Settings,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { siteConfig } from "@/config/site.config";
import type { NavItem } from "@/config/site.config";
import { ElementType, useCallback, useState } from "react";

/** Map icon name strings from site config to actual Lucide components */
const ICON_MAP: Record<string, ElementType> = {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Users,
  Activity,
  Shield,
  UserCog,
  Settings,
  User,
};

const NAV_ITEMS = siteConfig.nav.main as unknown as NavItem[];
const BOTTOM_ITEMS = siteConfig.nav.bottom as unknown as NavItem[];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, pages, logout } = useAuthStore();
  /** Compute which groups should be auto-expanded based on the current pathname */
  const computeInitialExpanded = useCallback(() => {
    const initial: Record<string, boolean> = {};
    NAV_ITEMS.forEach((item) => {
      if (item.items?.some((subItem) => pathname.startsWith(subItem.href))) {
        initial[item.label] = true;
      }
    });
    return initial;
  }, [pathname]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    computeInitialExpanded,
  );

  /** Check whether the current user has access to a given page URL */
  const hasPageAccess = useCallback(
    (pageUrl?: string) => {
      if (!pageUrl) return true;
      // If pages array is empty, assume full access (e.g. admin)
      if (pages.length === 0) return true;
      return pages.includes(pageUrl);
    },
    [pages],
  );

  const hasGroupAccess = useCallback(
    (item: NavItem) => {
      if (!item.items) return hasPageAccess(item.pageUrl);
      return item.items.some((sub) => hasPageAccess(sub.pageUrl));
    },
    [hasPageAccess],
  );

  const isActive = useCallback(
    (href: string) => {
      if (href === "/dashboard") return pathname === href;
      return pathname.startsWith(href);
    },
    [pathname],
  );

  const isGroupActive = useCallback(
    (item: NavItem) => {
      return (
        item.items?.some((subItem) => pathname.startsWith(subItem.href)) ??
        false
      );
    },
    [pathname],
  );

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
          collapsed ? "w-0 lg:w-16 overflow-hidden" : "w-64",
          "lg:relative lg:z-0",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
          {!collapsed && (
            <Link
              href="/dashboard"
              className="font-bold text-lg text-sidebar-foreground"
            >
              Kolab
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onToggle}
            className="text-sidebar-foreground hidden lg:flex"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180",
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onToggle}
            className="text-sidebar-foreground lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {NAV_ITEMS.filter(hasGroupAccess).map((item) => {
            if (item.items) {
              const isExpanded = expandedGroups[item.label] || false;
              const groupActive = isGroupActive(item);
              const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;

              return (
                <div key={item.label} className="relative group/menu space-y-1">
                  {collapsed ? (
                    // Collapsed state: Icon only with hover popup menu
                    <div className="relative">
                      <button
                        onClick={onToggle}
                        className={cn(
                          "flex items-center justify-center w-full rounded-md p-2 text-sm transition-colors",
                          groupActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                        )}
                        title={item.label}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                      </button>

                      {/* Hover Floating Menu */}
                      <div className="absolute left-full top-0 ml-2 z-50 w-48 hidden group-hover/menu:block bg-sidebar border border-sidebar-border rounded-lg shadow-lg p-2 space-y-1">
                        <div className="px-3 py-1.5 text-xs font-semibold text-sidebar-foreground/50 border-b border-sidebar-border mb-1">
                          {item.label}
                        </div>
                        {item.items
                          .filter((sub) => hasPageAccess(sub.pageUrl))
                          .map((sub) => {
                            const subActive = pathname.startsWith(sub.href);
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                className={cn(
                                  "flex items-center rounded-md px-3 py-1.5 text-xs transition-colors",
                                  subActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                                )}
                              >
                                {sub.label}
                              </Link>
                            );
                          })}
                      </div>
                    </div>
                  ) : (
                    // Expanded state: Accordion layout
                    <>
                      <button
                        onClick={() => toggleGroup(item.label)}
                        className={cn(
                          "flex items-center justify-between w-full rounded-md px-3 py-2 text-sm transition-colors text-left",
                          groupActive
                            ? "text-sidebar-foreground font-semibold"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 opacity-55" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 opacity-55" />
                        )}
                      </button>

                      {/* Animate-height container */}
                      <div
                        className={cn(
                          "grid transition-all duration-200 ease-in-out pl-7 space-y-0.5",
                          isExpanded
                            ? "grid-rows-[1fr] opacity-100 py-1"
                            : "grid-rows-[0fr] opacity-0 overflow-hidden pointer-events-none",
                        )}
                      >
                        <div className="overflow-hidden space-y-1">
                          {item.items
                            .filter((sub) => hasPageAccess(sub.pageUrl))
                            .map((sub) => {
                              const subActive = pathname.startsWith(sub.href);
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  className={cn(
                                    "flex items-center rounded-md px-3 py-1.5 text-sm transition-colors",
                                    subActive
                                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40",
                                  )}
                                >
                                  {sub.label}
                                </Link>
                              );
                            })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            }

            return (
              <SidebarItem
                key={item.href}
                item={item}
                collapsed={collapsed}
                isActive={isActive(item.href || "")}
              />
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border py-2 px-2 space-y-1">
          {BOTTOM_ITEMS.filter((item) => hasPageAccess(item.pageUrl)).map(
            (item) => (
              <SidebarItem
                key={item.href}
                item={item}
                collapsed={collapsed}
                isActive={isActive(item.href || "")}
              />
            ),
          )}
          {collapsed ? (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full py-2 text-sidebar-foreground/60 hover:text-sidebar-foreground"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <div className="px-3 py-2 space-y-2">
              <div className="flex items-center gap-2 text-sm text-sidebar-foreground/80">
                <User className="h-4 w-4" />
                <span className="truncate">{user?.name || "User"}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground text-xs"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function SidebarItem({
  item,
  collapsed,
  isActive,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
}) {
  const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;

  return (
    <Link
      href={item.href || "#"}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
        collapsed && "justify-center px-2",
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}
