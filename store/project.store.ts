import { api_client } from "@/lib/api/api-client";
import { hashFilters, dedupeById } from "@/lib/pagination";
import type {
  ProjectListItem,
  CreateProjectParams,
  UpdateProjectParams,
} from "@/types/db/project.types";
import type { PaginationMeta, PaginatedData, CachedPage } from "@/types/types";
import { create } from "zustand";

interface ProjectState {
  items: ProjectListItem[];
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  /** pageCache key = filterHash|p{page}|s{pageSize} */
  pageCache: Map<string, CachedPage<ProjectListItem>>;
  fullyLoadedFilters: Set<string>;
  currentFilterHash: string;
  searchResults: ProjectListItem[] | null;
  isSearching: boolean;
}

interface ProjectActions {
  fetchProjects: (filters?: {
    search?: string;
    status?: string;
    deadlineStatus?: string;
    page?: number;
    pageSize?: number;
  }) => Promise<void>;
  refetchProjects: () => Promise<void>;
  goToPage: (page: number, pageSize?: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  getProjectById: (id: string) => Promise<{
    success: boolean;
    data?: ProjectListItem;
    message?: string;
  }>;
  createProject: (
    data: CreateProjectParams,
  ) => Promise<{ success: boolean; data?: ProjectListItem; message?: string }>;
  updateProject: (
    id: string,
    data: UpdateProjectParams,
  ) => Promise<{ success: boolean; data?: ProjectListItem; message?: string }>;
  deleteProject: (
    id: string,
  ) => Promise<{ success: boolean; message?: string }>;
  searchProjects: (query: string) => Promise<void>;
  clearSearch: () => void;
  clearCache: () => void;
}

type ProjectStore = ProjectState & ProjectActions;

export const useProjectStore = create<ProjectStore>((set, get) => ({
  items: [],
  pagination: null,
  isLoading: false,
  error: null,
  pageCache: new Map(),
  fullyLoadedFilters: new Set(),
  currentFilterHash: "",
  searchResults: null,
  isSearching: false,

  fetchProjects: async (filters = {}) => {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const filterHash = hashFilters(filters as Record<string, unknown>);
    const cacheKey = `${filterHash}|p${page}|s${pageSize}`;
    const state = get();

    // ── Check cache ──
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
      const res = await api_client.get(`/projects?${query}`);
      const responseData = res.data?.data as
        | PaginatedData<ProjectListItem>
        | undefined;

      if (!responseData) {
        set({ isLoading: false, error: "Invalid response" });
        return;
      }

      const { items: newItems, pagination: paginationMeta } = responseData;

      // Update cache
      const newPageCache = new Map(state.pageCache);
      newPageCache.set(cacheKey, {
        items: newItems,
        pagination: paginationMeta,
        fetchedAt: Date.now(),
      });

      // Accumulate items from all cached pages for this filter hash
      const allItems: ProjectListItem[] = [];
      Array.from(newPageCache.entries())
        .filter(([k]) => k.startsWith(`${filterHash}|`))
        .sort(([a], [b]) => {
          const ap = parseInt(a.split("|p")[1]?.split("|")[0] || "0", 10);
          const bp = parseInt(b.split("|p")[1]?.split("|")[0] || "0", 10);
          return ap - bp;
        })
        .forEach(([, cp]) => allItems.push(...cp.items));

      const dedupedItems = dedupeById(allItems);

      // Check if all pages loaded
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
          ?.error || "Failed to fetch projects";
      set({ error: message, isLoading: false });
    }
  },

  refetchProjects: async () => {
    const state = get();
    const page = state.pagination?.currentPage || 1;
    const pageSize = state.pagination?.pageSize || 10;
    const filterHash = state.currentFilterHash;

    // Clear cache for this filter hash
    const newPageCache = new Map(state.pageCache);
    Array.from(newPageCache.keys())
      .filter((k) => k.startsWith(`${filterHash}|`))
      .forEach((k) => newPageCache.delete(k));
    const newFullyLoaded = new Set(state.fullyLoadedFilters);
    newFullyLoaded.delete(filterHash);

    set({ pageCache: newPageCache, fullyLoadedFilters: newFullyLoaded });

    // Re-fetch with current filters reconstructed from filterHash
    let filters: Record<string, unknown> = {};
    try {
      filters = JSON.parse(filterHash || "{}");
    } catch {
      filters = {};
    }
    await get().fetchProjects({ ...filters, page, pageSize });
  },

  goToPage: async (page, pageSize) => {
    const state = get();
    let filters: Record<string, unknown> = {};
    try {
      filters = JSON.parse(state.currentFilterHash || "{}");
    } catch {
      filters = {};
    }
    await get().fetchProjects({
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

  getProjectById: async (id: string) => {
    try {
      const res = await api_client.get(`/projects/${id}`);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Project not found";
      return { success: false, message };
    }
  },

  createProject: async (data) => {
    try {
      const res = await api_client.post("/projects", data);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to create project";
      return { success: false, message };
    }
  },

  updateProject: async (id, data) => {
    try {
      const res = await api_client.patch(`/projects/${id}`, data);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to update project";
      return { success: false, message };
    }
  },

  deleteProject: async (id: string) => {
    try {
      await api_client.delete(`/projects/${id}`);
      set({ items: get().items.filter((p) => p.id !== id) });
      return { success: true };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to delete project";
      return { success: false, message };
    }
  },

  searchProjects: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: null, isSearching: false });
      return;
    }
    set({ isSearching: true });
    try {
      const res = await api_client.get(
        `/search?type=project&value=${encodeURIComponent(query.trim())}`,
      );
      set({
        searchResults: (res.data?.data as ProjectListItem[]) ?? [],
        isSearching: false,
      });
    } catch {
      set({ searchResults: [], isSearching: false });
    }
  },

  clearSearch: () => {
    set({ searchResults: null, isSearching: false });
  },

  clearCache: () => {
    set({
      items: [],
      pagination: null,
      pageCache: new Map(),
      fullyLoadedFilters: new Set(),
      currentFilterHash: "",
      searchResults: null,
      isSearching: false,
    });
  },
}));
