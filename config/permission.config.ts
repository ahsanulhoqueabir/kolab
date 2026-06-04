import type {
  PermissionGroup,
  AvailablePage,
} from "@/types/business/permission.types";

/**
 * All available permissions organized by module
 * This configuration defines what resource permissions are available in the system
 *
 * Actions allowed: create, read, update, delete only
 * Conditions:
 * - "all": Access to all records (Admin, Project Manager)
 * - "own": Access to records created by the user
 * - "assigned": Access to tasks assigned to the user (Team Member)
 */
export const PERMISSION_MODULES: PermissionGroup[] = [
  {
    label: "Project Management",
    labelKey: "permissions.modules.projects",
    permissions: [
      { resource: "project", action: "create" },
      { resource: "project", action: "read", condition: "all" },
      { resource: "project", action: "read", condition: "own" },
      { resource: "project", action: "update", condition: "all" },
      { resource: "project", action: "update", condition: "own" },
      { resource: "project", action: "delete" },
    ],
  },
  {
    label: "Task Management",
    labelKey: "permissions.modules.tasks",
    permissions: [
      { resource: "task", action: "create" },
      { resource: "task", action: "read", condition: "all" },
      { resource: "task", action: "read", condition: "own" },
      { resource: "task", action: "read", condition: "assigned" },
      { resource: "task", action: "update", condition: "all" },
      { resource: "task", action: "update", condition: "own" },
      { resource: "task", action: "update", condition: "assigned" },
      { resource: "task", action: "delete", condition: "all" },
      { resource: "task", action: "delete", condition: "own" },
    ],
  },

  {
    label: "Activity Log",
    labelKey: "permissions.modules.log",
    permissions: [{ resource: "log", action: "read", condition: "all" }],
  },
  {
    label: "Dashboard",
    labelKey: "permissions.modules.dashboard",
    permissions: [
      { resource: "dashboard", action: "read", condition: "all" },
      { resource: "dashboard", action: "read", condition: "own" },
    ],
  },
  {
    label: "Role Management",
    labelKey: "permissions.modules.roles",
    permissions: [
      { resource: "role", action: "create" },
      { resource: "role", action: "read" },
      { resource: "role", action: "update" },
      { resource: "role", action: "delete" },
    ],
  },
  {
    label: "User Management",
    labelKey: "permissions.modules.users",
    permissions: [
      { resource: "user", action: "read" },
      { resource: "user", action: "create" },
      { resource: "user", action: "update", condition: "all" },
      { resource: "user", action: "update", condition: "own" },
      { resource: "user", action: "delete" },
    ],
  },
  {
    label: "System Settings",
    labelKey: "permissions.modules.settings",
    permissions: [
      { resource: "settings", action: "read" },
      { resource: "settings", action: "update" },
    ],
  },
];

/**
 * Available pages configuration for role-based page permissions
 * This contains all the pages in the application that can be assigned to roles
 */
export const AVAILABLE_PAGES: AvailablePage[] = [
  // Dashboard
  {
    id: "dashboard",
    label: "Dashboard",
    url: "/dashboard",
    category: "Main",
    description: "Main dashboard page with project and task summary",
  },

  // Projects Module
  {
    id: "projects-list",
    label: "Projects List",
    url: "/projects",
    category: "Projects",
    description: "View all projects",
  },
  {
    id: "projects-create",
    label: "Create Project",
    url: "/projects/create",
    category: "Projects",
    description: "Create new project",
  },
  {
    id: "projects-edit",
    label: "Edit Project",
    url: "/projects/[id]/edit",
    category: "Projects",
    description: "Edit existing project",
  },
  {
    id: "projects-details",
    label: "Project Details",
    url: "/projects/[id]",
    category: "Projects",
    description: "View project details and tasks",
  },

  // Tasks Module
  {
    id: "tasks-list",
    label: "Tasks List",
    url: "/tasks",
    category: "Tasks",
    description: "View all tasks",
  },
  {
    id: "tasks-create",
    label: "Create Task",
    url: "/tasks/create",
    category: "Tasks",
    description: "Create new task under a project",
  },
  {
    id: "tasks-edit",
    label: "Edit Task",
    url: "/tasks/[id]/edit",
    category: "Tasks",
    description: "Edit existing task",
  },
  {
    id: "tasks-details",
    label: "Task Details",
    url: "/tasks/[id]",
    category: "Tasks",
    description: "View task details",
  },
  {
    id: "my-tasks",
    label: "My Tasks",
    url: "/my-tasks",
    category: "Tasks",
    description: "View tasks assigned to me",
  },

  // Team Management
  {
    id: "team-members",
    label: "Team Members",
    url: "/team",
    category: "Team",
    description: "View team members and assignments",
  },

  // Activity Log
  {
    id: "activity-log",
    label: "Activity Log",
    url: "/activity-log",
    category: "System",
    description: "View recent system activities",
  },

  // Role Management
  {
    id: "roles-list",
    label: "Roles List",
    url: "/role-management",
    category: "Administration",
    description: "View all roles",
  },
  {
    id: "roles-create",
    label: "Create Role",
    url: "/role-management/+",
    category: "Administration",
    description: "Create new role",
  },
  {
    id: "roles-edit",
    label: "Edit Role",
    url: "/role-management/[id]",
    category: "Administration",
    description: "Edit existing role",
  },

  // User Management
  {
    id: "users-list",
    label: "Users List",
    url: "/users",
    category: "Administration",
    description: "View all users",
  },
  {
    id: "users-create",
    label: "Create User",
    url: "/users/create",
    category: "Administration",
    description: "Create new user",
  },
  {
    id: "users-edit",
    label: "Edit User",
    url: "/users/[id]/edit",
    category: "Administration",
    description: "Edit existing user",
  },
  {
    id: "profile",
    label: "Profile",
    url: "/profile",
    category: "User",
    description: "User profile page",
  },

  // Settings
  {
    id: "settings",
    label: "Settings",
    url: "/settings",
    category: "System",
    description: "System settings and preferences",
  },
];

/**
 * Mapping between page URLs and required resource permissions
 * When a page is selected, the corresponding resource permissions are automatically enabled
 */
export const PAGE_TO_RESOURCE_PERMISSION_MAP: Record<string, string[]> = {
  // Dashboard
  "/dashboard": ["dashboard:read:all", "dashboard:read:own"],

  // Projects
  "/projects": ["project:read:all", "project:read:own"],
  "/projects/create": ["project:create"],
  "/projects/[id]/edit": ["project:update:all", "project:update:own"],
  "/projects/[id]": ["project:read:all", "project:read:own"],

  // Tasks
  "/tasks": ["task:read:all", "task:read:own", "task:read:assigned"],
  "/tasks/create": ["task:create", "project:update:own"],
  "/tasks/[id]/edit": [
    "task:update:all",
    "task:update:own",
    "task:update:assigned",
  ],
  "/tasks/[id]": ["task:read:all", "task:read:own", "task:read:assigned"],
  "/my-tasks": ["task:read:assigned"],

  // Team
  "/team": ["project:read:all", "project:read:own"],

  // Activity Log
  "/activity-log": ["log:read:all"],

  // Roles
  "/role-management": ["role:read"],
  "/role-management/+": ["role:create"],
  "/role-management/[id]": ["role:update", "role:read"],

  // Users
  "/users": ["user:read"],
  "/users/create": ["user:create"],
  "/users/[id]/edit": ["user:update:all"],
  "/profile": ["user:update:own"],

  // Settings
  "/settings": ["settings:read"],
};
