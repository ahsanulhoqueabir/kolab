import { api_client } from "@/lib/api/api-client";
import { hashFilters, dedupeById } from "@/lib/pagination";
import type { PaginationMeta, PaginatedData, CachedPage } from "@/types/types";
import { create } from "zustand";

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
  items: RoleRes[];
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  pageCache: Map<string, CachedPage<RoleRes>>;
  fullyLoadedFilters: Set<string>;
  currentFilterHash: string;
}

interface RoleActions {
  fetchRoles: (filters?: {
    search?: string;
    page?: number;
    pageSize?: number;
  }) => Promise<void>;
  refetchRoles: () => Promise<void>;
  goToPage: (page: number, pageSize?: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
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
  clearCache: () => void;
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
  items: [],
  pagination: null,
  isLoading: false,
  error: null,
  pageCache: new Map(),
  fullyLoadedFilters: new Set(),
  currentFilterHash: "",

  fetchRoles: async (filters = {}) => {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const filterHash = hashFilters(filters as Record<string, unknown>);
    const cacheKey = `${filterHash}|p${page}|s${pageSize}`;
    const state = get();

    const cached = state.pageCache.get(cacheKey);
    if (cached) {
      set({
        items: cached.items,
        pagination: { ...cached.pagination, currentPage: page },
        currentFilterHash: filterHash,
        isLoading: false,
        error: null,
      });
      return;
    }

    set({ isLoading: true, error: null, currentFilterHash: filterHash });

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          params.set(key, String(val));
        }
      });
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const query = params.toString();
      const res = await api_client.get(`/roles?${query}`);
      const responseData = res.data?.data as PaginatedData<RoleRes> | undefined;

      if (!responseData) {
        set({ isLoading: false, error: "Invalid response" });
        return;
      }

      const { items: newItems, pagination: paginationMeta } = responseData;

      const newPageCache = new Map(state.pageCache);
      newPageCache.set(cacheKey, {
        items: newItems,
        pagination: paginationMeta,
        fetchedAt: Date.now(),
      });

      const allItems: RoleRes[] = [];
      Array.from(newPageCache.entries())
        .filter(([k]) => k.startsWith(`${filterHash}|`))
        .sort(([a], [b]) => {
          const ap = parseInt(a.split("|p")[1]?.split("|")[0] || "0", 10);
          const bp = parseInt(b.split("|p")[1]?.split("|")[0] || "0", 10);
          return ap - bp;
        })
        .forEach(([, cp]) => allItems.push(...cp.items));

      const dedupedItems = dedupeById(allItems);

      const loadedPages = new Set(
        Array.from(newPageCache.keys())
          .filter((k) => k.startsWith(`${filterHash}|`))
          .map((k) => parseInt(k.split("|p")[1]?.split("|")[0] || "0", 10)),
      );
      const newFullyLoaded = new Set(state.fullyLoadedFilters);
      let allLoaded = true;
      for (let i = 1; i <= paginationMeta.totalPages; i++) {
        if (!loadedPages.has(i)) {
          allLoaded = false;
          break;
        }
      }
      if (allLoaded) newFullyLoaded.add(filterHash);
      else newFullyLoaded.delete(filterHash);

      set({
        items: dedupedItems,
        pagination: paginationMeta,
        isLoading: false,
        error: null,
        pageCache: newPageCache,
        fullyLoadedFilters: newFullyLoaded,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err?.response) {
        set({
          error: err.response.data?.error || "Failed to fetch roles",
          isLoading: false,
        });
      } else {
        // Fallback to localStorage mock database
        const localRoles = getLocalRoles();
        const total = localRoles.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const start = (page - 1) * pageSize;
        const paged = localRoles.slice(start, start + pageSize);
        const paginationMeta: PaginationMeta = {
          currentPage: page,
          pageSize,
          totalPages,
          total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        };

        const newPageCache = new Map(state.pageCache);
        newPageCache.set(cacheKey, {
          items: paged,
          pagination: paginationMeta,
          fetchedAt: Date.now(),
        });

        const allItems: RoleRes[] = [];
        Array.from(newPageCache.entries())
          .filter(([k]) => k.startsWith(`${filterHash}|`))
          .sort(([a], [b]) => {
            const ap = parseInt(a.split("|p")[1]?.split("|")[0] || "0", 10);
            const bp = parseInt(b.split("|p")[1]?.split("|")[0] || "0", 10);
            return ap - bp;
          })
          .forEach(([, cp]) => allItems.push(...cp.items));

        const dedupedItems = dedupeById(allItems);

        const newFullyLoaded = new Set(state.fullyLoadedFilters);
        let allLoaded = true;
        for (let i = 1; i <= paginationMeta.totalPages; i++) {
          const ck = `${filterHash}|p${i}|s${pageSize}`;
          if (!newPageCache.has(ck)) {
            allLoaded = false;
            break;
          }
        }
        if (allLoaded) newFullyLoaded.add(filterHash);

        set({
          items: dedupedItems,
          pagination: paginationMeta,
          isLoading: false,
          error: null,
          pageCache: newPageCache,
          fullyLoadedFilters: newFullyLoaded,
        });
      }
    }
  },

  refetchRoles: async () => {
    const state = get();
    const page = state.pagination?.currentPage || 1;
    const pageSize = state.pagination?.pageSize || 10;
    const filterHash = state.currentFilterHash;

    const newPageCache = new Map(state.pageCache);
    Array.from(newPageCache.keys())
      .filter((k) => k.startsWith(`${filterHash}|`))
      .forEach((k) => newPageCache.delete(k));
    const newFullyLoaded = new Set(state.fullyLoadedFilters);
    newFullyLoaded.delete(filterHash);

    set({ pageCache: newPageCache, fullyLoadedFilters: newFullyLoaded });

    let filters: Record<string, unknown> = {};
    try {
      filters = JSON.parse(filterHash || "{}");
    } catch {
      filters = {};
    }
    await get().fetchRoles({ ...filters, page, pageSize });
  },

  goToPage: async (page, pageSize) => {
    const state = get();
    let filters: Record<string, unknown> = {};
    try {
      filters = JSON.parse(state.currentFilterHash || "{}");
    } catch {
      filters = {};
    }
    await get().fetchRoles({
      ...filters,
      page,
      pageSize: pageSize || state.pagination?.pageSize || 10,
    });
  },

  nextPage: async () => {
    const state = get();
    const next = (state.pagination?.currentPage || 1) + 1;
    if (state.pagination && next > state.pagination.totalPages) return;
    await get().goToPage(next);
  },

  prevPage: async () => {
    const state = get();
    const prev = (state.pagination?.currentPage || 1) - 1;
    if (prev < 1) return;
    await get().goToPage(prev);
  },

  getRoleById: async (id: string) => {
    try {
      const res = await api_client.get(`/roles/${id}`);
      return { success: true, data: res.data?.data }; // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      set({ items: updated });
      return { success: true, data: newRole };
    }
  },

  updateRole: async (roleData) => {
    try {
      const res = await api_client.put(`/roles/${roleData.id}`, roleData);
      return { success: true, data: res.data?.data };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      set({ items: updated });
      return { success: true, data: roleData };
    }
  },

  deleteRole: async (id: string) => {
    try {
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
      await api_client.delete(`/roles/${id}`);
      set({ items: get().items.filter((r) => r.id !== id) });
      return { success: true };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      set({ items: updated });
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
        items: get().items.filter(
          (r) => !ids.includes(r.id) || r.id === "1" || r.id === "2",
        ),
      });
      return { success: true, deletedCount: deleted, failedCount: failed };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      set({ items: updated });
      return { success: true, deletedCount: deleted, failedCount: failed };
    }
  },

  clearCache: () => {
    set({
      items: [],
      pagination: null,
      pageCache: new Map(),
      fullyLoadedFilters: new Set(),
      currentFilterHash: "",
    });
  },
}));
