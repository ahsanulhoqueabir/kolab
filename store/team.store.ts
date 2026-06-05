import { api_client } from "@/lib/api/api-client";
import { hashFilters, dedupeById } from "@/lib/pagination";
import type {
  TeamMember,
  AddMemberParams,
  WorkloadItem,
} from "@/types/db/team.types";
import type { PaginationMeta, PaginatedData, CachedPage } from "@/types/types";
import { create } from "zustand";

interface TeamState {
  items: TeamMember[];
  /** Unified list from /api/team/list (all teams or own manager entries) */
  unifiedItems: TeamMember[];
  pagination: PaginationMeta | null;
  workload: WorkloadItem[];
  isLoading: boolean;
  error: string | null;
  pageCache: Map<string, CachedPage<TeamMember>>;
  fullyLoadedFilters: Set<string>;
  currentFilterHash: string;
}

interface TeamActions {
  fetchTeamMembers: (
    projectId: string,
    filters?: {
      search?: string;
      page?: number;
      pageSize?: number;
    },
  ) => Promise<void>;
  fetchUnifiedTeam: () => Promise<void>;
  goToPage: (page: number, pageSize?: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  addMember: (
    params: AddMemberParams,
  ) => Promise<{ success: boolean; data?: TeamMember; message?: string }>;
  removeMember: (
    projectId: string,
    profileId: string,
  ) => Promise<{ success: boolean; message?: string }>;
  fetchWorkload: (projectId?: string) => Promise<void>;
  clearCache: () => void;
}

type TeamStore = TeamState & TeamActions;

export const useTeamStore = create<TeamStore>((set, get) => ({
  items: [],
  unifiedItems: [],
  pagination: null,
  workload: [],
  isLoading: false,
  error: null,
  pageCache: new Map(),
  fullyLoadedFilters: new Set(),
  currentFilterHash: "",

  fetchTeamMembers: async (projectId, filters = {}) => {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const filterHash = hashFilters({ projectId, ...filters } as Record<
      string,
      unknown
    >);

    // Reset unified items when fetching per-project
    set({ unifiedItems: [] });
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
      const params = new URLSearchParams({ projectId });
      Object.entries(filters).forEach(([key, val]) => {
        if (
          val !== undefined &&
          val !== null &&
          val !== "" &&
          key !== "projectId"
        ) {
          params.set(key, String(val));
        }
      });
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const query = params.toString();
      const res = await api_client.get(`/team?${query}`);
      const responseData = res.data?.data as
        | PaginatedData<TeamMember>
        | undefined;

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

      const allItems: TeamMember[] = [];
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
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to fetch team members";
      set({ error: message, isLoading: false });
    }
  },

  fetchUnifiedTeam: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api_client.get("/team/list");
      const data = (res.data?.data as TeamMember[]) ?? [];
      set({ unifiedItems: data, items: [], isLoading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to fetch unified team";
      set({ error: message, isLoading: false });
    }
  },

  goToPage: async (page, pageSize) => {
    const state = get();
    let filters: Record<string, unknown> = {};
    try {
      filters = JSON.parse(state.currentFilterHash || "{}");
    } catch {
      filters = {};
    }
    const projectId = (filters.projectId as string) || "";
    await get().fetchTeamMembers(projectId, {
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

  addMember: async (params) => {
    try {
      const res = await api_client.post("/team", params);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to add member";
      return { success: false, message };
    }
  },

  removeMember: async (projectId, profileId) => {
    try {
      await api_client.delete(`/team/${profileId}?projectId=${projectId}`);
      return { success: true };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to remove member";
      return { success: false, message };
    }
  },

  fetchWorkload: async (projectId?: string) => {
    try {
      const query = projectId ? `?projectId=${projectId}` : "";
      const res = await api_client.get(`/team/workload${query}`);
      set({ workload: res.data?.data || [] });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to fetch workload";
      set({ error: message });
    }
  },

  clearCache: () => {
    set({
      items: [],
      unifiedItems: [],
      pagination: null,
      pageCache: new Map(),
      fullyLoadedFilters: new Set(),
      currentFilterHash: "",
    });
  },
}));
