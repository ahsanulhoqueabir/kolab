// ========================================
// RESOURCE PERMISSION TYPES
// ========================================

export type PermissionResource =
  | "project"
  | "task"
  | "team"
  | "log"
  | "dashboard"
  | "role"
  | "user"
  | "settings";

export type PermissionAction = "create" | "read" | "update" | "delete";

export type PermissionCondition = "own" | "all" | "assigned" | null;

export interface Permission {
  resource: PermissionResource;
  action: PermissionAction;
  condition?: PermissionCondition;
}

export interface PermissionGroup {
  label: string;
  labelKey: string;
  icon?: string;
  permissions: Permission[];
}

// Permission string format: "resource:action:condition"
// Example: "task:read:assigned", "project:update:own", "user:create"
export type PermissionString = string;

// ========================================
// PAGE PERMISSION TYPES
// ========================================

export interface AvailablePage {
  id: string;
  label: string;
  url: string;
  category: string;
  description?: string;
}
