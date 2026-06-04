import { app } from "./env.config";

export interface NavSubItem {
  label: string;
  href: string;
  pageUrl?: string;
}

export interface NavItem {
  label: string;
  href?: string;
  icon: string;
  pageUrl?: string;
  items?: NavSubItem[];
}

// ─── Site Config ───────────────────────────────────────────────────────────

export const siteConfig = {
  name: "Kolab",
  description:
    "Smart Project & Task Collaboration System. Manage projects, track tasks, and collaborate with your team in one unified platform.",
  tagline: "Empower Your Team, Simplify Your Projects",
  url: app.url || "http://localhost:3000",
  nav: {
    main: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: "LayoutDashboard",
        pageUrl: "/dashboard",
      },
      {
        label: "Project Management",
        icon: "FolderKanban",
        items: [
          {
            label: "Project List",
            href: "/projects",
            pageUrl: "/projects",
          },
          {
            label: "Create Project",
            href: "/projects/create",
            pageUrl: "/projects/create",
          },
          {
            label: "Team List",
            href: "/team",
            pageUrl: "/team",
          },
          {
            label: "Add Member",
            href: "/team?action=add",
            pageUrl: "/team",
          },
        ],
      },
      {
        label: "Task Management",
        icon: "ListChecks",
        items: [
          {
            label: "Task List",
            href: "/tasks",
            pageUrl: "/tasks",
          },
          {
            label: "Create Task",
            href: "/tasks/create",
            pageUrl: "/tasks/create",
          },
          {
            label: "My Tasks",
            href: "/my-tasks",
            pageUrl: "/my-tasks",
          },
        ],
      },
      {
        label: "User Management",
        icon: "UserCog",
        items: [
          {
            label: "Users",
            href: "/users",
            pageUrl: "/users",
          },
          {
            label: "Role Management",
            href: "/role-management",
            pageUrl: "/role-management",
          },
        ],
      },
      {
        label: "Activity Log",
        href: "/activity-log",
        icon: "Activity",
        pageUrl: "/activity-log",
      },
    ] satisfies NavItem[],
    bottom: [
      {
        label: "Profile",
        href: "/profile",
        icon: "User",
        pageUrl: "/profile",
      },
      {
        label: "Settings",
        href: "/settings",
        icon: "Settings",
        pageUrl: "/settings",
      },
    ] satisfies NavItem[],
  },
} as const;

export type SiteConfig = typeof siteConfig;
