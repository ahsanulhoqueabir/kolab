import { create } from "zustand";
import { api_client } from "@/lib/api/api-client";

export interface RoleRes {
  id: string;
  name: string;
  landing_page?: string | null;
  permission?: { name: string }[] | null;
  page?: { url: string }[] | null;
  created_at?: string;
  updated_at?: string;
}

interface RoleState {
  roles: RoleRes[];
  isLoading: boolean;
  error: string | null;
}

interface RoleActions {
  fetchRoles: () => Promise<void>;
  refetchRoles: () => Promise<void>;
  getRoleById: (
    id: string,
  ) => Promise<{ success: boolean; data?: RoleRes; message?: string }>;
  createRole: (
    roleData: Omit<RoleRes, "id">,
  ) => Promise<{ success: boolean; data?: RoleRes; message?: string }>;
  updateRole: (
    roleData: RoleRes,
  ) => Promise<{ success: boolean; data?: RoleRes; message?: string }>;
  deleteRole: (id: string) => Promise<{
    success: boolean;
    hasProfiles?: boolean;
    profileCounts?: {
      total: number;
      statusCounts: { published: number; draft: number; archived: number };
    };
    message?: string;
  }>;
  checkDeleteStatus: (id: string) => Promise<{
    success: boolean;
    canDelete: boolean;
    meta?: { message?: string };
    message?: string;
  }>;
  bulkDeleteRoles: (
    ids: string[],
  ) => Promise<{ success: boolean; deletedCount: number; failedCount: number }>;
}

type RoleStore = RoleState & RoleActions;

// Mock roles for local fallback
const DEFAULT_ROLES: RoleRes[] = [
  {
    id: "1",
    name: "Admin",
    landing_page: "/dashboard",
    permission: [
      { name: "project:create" },
      { name: "project:read:all" },
      { name: "project:update:all" },
      { name: "project:delete" },
      { name: "task:create" },
      { name: "task:read:all" },
      { name: "task:update:all" },
      { name: "task:delete:all" },
      { name: "role:create" },
      { name: "role:read" },
      { name: "role:update" },
      { name: "role:delete" },
      { name: "user:read" },
      { name: "user:create" },
      { name: "user:update:all" },
      { name: "user:delete" },
    ],
    page: [
      { url: "/dashboard" },
      { url: "/projects" },
      { url: "/projects/create" },
      { url: "/projects/[id]/edit" },
      { url: "/projects/[id]" },
      { url: "/tasks" },
      { url: "/tasks/create" },
      { url: "/tasks/[id]/edit" },
      { url: "/tasks/[id]" },
      { url: "/role-management" },
      { url: "/role-management/+" },
      { url: "/role-management/[id]" },
      { url: "/users" },
      { url: "/users/create" },
      { url: "/users/[id]/edit" },
    ],
  },
  {
    id: "2",
    name: "Project Manager",
    landing_page: "/projects",
    permission: [
      { name: "project:read:all" },
      { name: "project:update:own" },
      { name: "task:create" },
      { name: "task:read:all" },
      { name: "task:update:all" },
    ],
    page: [
      { url: "/dashboard" },
      { url: "/projects" },
      { url: "/projects/[id]" },
      { url: "/tasks" },
      { url: "/tasks/create" },
      { url: "/tasks/[id]/edit" },
    ],
  },
];

function getLocalRoles(): RoleRes[] {
  if (typeof window === "undefined") return DEFAULT_ROLES;
  const data = localStorage.getItem("hrm_mock_roles");
  if (!data) {
    localStorage.setItem("hrm_mock_roles", JSON.stringify(DEFAULT_ROLES));
    return DEFAULT_ROLES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_ROLES;
  }
}

function saveLocalRoles(roles: RoleRes[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("hrm_mock_roles", JSON.stringify(roles));
}

export const useRoleStore = create<RoleStore>((set, get) => ({
  roles: [],
  isLoading: false,
  error: null,

  fetchRoles: async () => {
    set({ isLoading: true, error: null });
    try {
      // Try hitting the actual API
      const res = await api_client.get("/roles");
      set({ roles: res.data?.data || [], isLoading: false });
    } catch (err: any) {
      if (err.response) {
        set({
          error: err.response.data?.error || "Failed to fetch roles",
          isLoading: false,
        });
      } else {
        // Fallback to localStorage mock database
        const localRoles = getLocalRoles();
        set({ roles: localRoles, isLoading: false });
      }
    }
  },

  refetchRoles: async () => {
    await get().fetchRoles();
  },

  getRoleById: async (id: string) => {
    try {
      const res = await api_client.get(`/roles/${id}`);
      return { success: true, data: res.data?.data };
    } catch (err: any) {
      if (err.response) {
        return {
          success: false,
          message: err.response.data?.error || "Role not found",
        };
      }
      const localRoles = getLocalRoles();
      const role = localRoles.find((r) => r.id === id);
      if (role) {
        return { success: true, data: role };
      }
      return { success: false, message: "Role not found" };
    }
  },

  createRole: async (roleData) => {
    try {
      const res = await api_client.post("/roles", roleData);
      return { success: true, data: res.data?.data };
    } catch (err: any) {
      if (err.response) {
        return {
          success: false,
          message: err.response.data?.error || "Failed to create role",
        };
      }
      const localRoles = getLocalRoles();
      const newRole: RoleRes = {
        ...roleData,
        id: String(Date.now()),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updated = [...localRoles, newRole];
      saveLocalRoles(updated);
      set({ roles: updated });
      return { success: true, data: newRole };
    }
  },

  updateRole: async (roleData) => {
    try {
      const res = await api_client.put(`/roles/${roleData.id}`, roleData);
      return { success: true, data: res.data?.data };
    } catch (err: any) {
      if (err.response) {
        return {
          success: false,
          message: err.response.data?.error || "Failed to update role",
        };
      }
      const localRoles = getLocalRoles();
      const updated = localRoles.map((r) =>
        r.id === roleData.id
          ? { ...r, ...roleData, updated_at: new Date().toISOString() }
          : r,
      );
      saveLocalRoles(updated);
      set({ roles: updated });
      return { success: true, data: roleData };
    }
  },

  deleteRole: async (id: string) => {
    try {
      // Mocking check for in-use
      if (id === "1" || id === "2") {
        // Admin and Project Manager roles cannot be deleted because they are assigned to profiles
        return {
          success: false,
          hasProfiles: true,
          profileCounts: {
            total: 3,
            statusCounts: { published: 2, draft: 1, archived: 0 },
          },
          message: "Role is currently assigned to profiles",
        };
      }
      await api_client.delete(`/roles/${id}`);
      set({ roles: get().roles.filter((r) => r.id !== id) });
      return { success: true };
    } catch (err: any) {
      if (err.response) {
        const errorData = err.response.data || {};
        return {
          success: false,
          hasProfiles: errorData.hasProfiles || false,
          profileCounts: errorData.profileCounts || undefined,
          message: errorData.error || "Failed to delete role",
        };
      }
      if (id === "1" || id === "2") {
        return {
          success: false,
          hasProfiles: true,
          profileCounts: {
            total: 3,
            statusCounts: { published: 2, draft: 1, archived: 0 },
          },
          message: "Role is currently assigned to profiles",
        };
      }
      const localRoles = getLocalRoles();
      const updated = localRoles.filter((r) => r.id !== id);
      saveLocalRoles(updated);
      set({ roles: updated });
      return { success: true };
    }
  },

  checkDeleteStatus: async (id: string) => {
    try {
      if (id === "1" || id === "2") {
        return {
          success: true,
          canDelete: false,
          meta: { message: "This role is assigned to core system users." },
        };
      }
      return { success: true, canDelete: true };
    } catch {
      if (id === "1" || id === "2") {
        return {
          success: true,
          canDelete: false,
          meta: { message: "This role is assigned to core system users." },
        };
      }
      return { success: true, canDelete: true };
    }
  },

  bulkDeleteRoles: async (ids: string[]) => {
    try {
      let deleted = 0;
      let failed = 0;
      for (const id of ids) {
        if (id === "1" || id === "2") {
          failed++;
        } else {
          await api_client.delete(`/roles/${id}`);
          deleted++;
        }
      }
      set({
        roles: get().roles.filter(
          (r) => !ids.includes(r.id) || r.id === "1" || r.id === "2",
        ),
      });
      return { success: true, deletedCount: deleted, failedCount: failed };
    } catch (err: any) {
      if (err.response) {
        return {
          success: false,
          deletedCount: 0,
          failedCount: ids.length,
        };
      }
      let deleted = 0;
      let failed = 0;
      const localRoles = getLocalRoles();
      const updated = localRoles.filter((r) => {
        if (ids.includes(r.id)) {
          if (r.id === "1" || r.id === "2") {
            failed++;
            return true;
          }
          deleted++;
          return false;
        }
        return true;
      });
      saveLocalRoles(updated);
      set({ roles: updated });
      return { success: true, deletedCount: deleted, failedCount: failed };
    }
  },
}));
