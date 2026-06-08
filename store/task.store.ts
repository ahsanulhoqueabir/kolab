import { api_client } from "@/lib/api/api-client";
import { hashFilters, dedupeById } from "@/lib/pagination";
import type {
  TaskListItem,
  CreateTaskParams,
  UpdateTaskParams,
  TaskStatus,
} from "@/types/db/task.types";
import type { PaginationMeta, PaginatedData, CachedPage } from "@/types/types";
import { create } from "zustand";

interface TaskState {
  items: TaskListItem[];
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  pageCache: Map<string, CachedPage<TaskListItem>>;
  fullyLoadedFilters: Set<string>;
  currentFilterHash: string;
  searchResults: TaskListItem[] | null;
  isSearching: boolean;
}

interface TaskActions {
  fetchTasks: (filters?: {
    search?: string;
    status?: string;
    priority?: string;
    project?: string;
    assignedTo?: string;
    deadlineStatus?: string;
    page?: number;
    pageSize?: number;
  }) => Promise<void>;
  refetchTasks: () => Promise<void>;
  goToPage: (page: number, pageSize?: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  getTaskById: (id: string) => Promise<{
    success: boolean;
    data?: TaskListItem;
    message?: string;
  }>;
  createTask: (
    data: CreateTaskParams,
  ) => Promise<{ success: boolean; data?: TaskListItem; message?: string }>;
  updateTask: (
    id: string,
    data: UpdateTaskParams,
  ) => Promise<{ success: boolean; data?: TaskListItem; message?: string }>;
  deleteTask: (id: string) => Promise<{ success: boolean; message?: string }>;
  updateTaskStatus: (
    id: string,
    status: TaskStatus,
  ) => Promise<{ success: boolean; data?: TaskListItem; message?: string }>;
  searchTasks: (query: string) => Promise<void>;
  clearSearch: () => void;
  clearCache: () => void;
}

type TaskStore = TaskState & TaskActions;

export const useTaskStore = create<TaskStore>((set, get) => ({
  items: [],
  pagination: null,
  isLoading: false,
  error: null,
  pageCache: new Map(),
  fullyLoadedFilters: new Set(),
  currentFilterHash: "",
  searchResults: null,
  isSearching: false,

  fetchTasks: async (filters = {}) => {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const filterHash = hashFilters(filters as Record<string, unknown>);
    const cacheKey = `${filterHash}|p${page}|s${pageSize}`;
    const state = get();

    // Check cache
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
      const res = await api_client.get(`/tasks?${query}`);
      const responseData = res.data?.data as
        | PaginatedData<TaskListItem>
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

      const allItems: TaskListItem[] = [];
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
          ?.error || "Failed to fetch tasks";
      set({ error: message, isLoading: false });
    }
  },

  refetchTasks: async () => {
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
    await get().fetchTasks({ ...filters, page, pageSize });
  },

  goToPage: async (page, pageSize) => {
    const state = get();
    let filters: Record<string, unknown> = {};
    try {
      filters = JSON.parse(state.currentFilterHash || "{}");
    } catch {
      filters = {};
    }
    await get().fetchTasks({
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

  getTaskById: async (id: string) => {
    try {
      const res = await api_client.get(`/tasks/${id}`);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Task not found";
      return { success: false, message };
    }
  },

  createTask: async (data) => {
    try {
      const res = await api_client.post("/tasks", data);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to create task";
      return { success: false, message };
    }
  },

  updateTask: async (id, data) => {
    try {
      const res = await api_client.patch(`/tasks/${id}`, data);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to update task";
      return { success: false, message };
    }
  },

  deleteTask: async (id: string) => {
    try {
      await api_client.delete(`/tasks/${id}`);
      set({ items: get().items.filter((t) => t.id !== id) });
      return { success: true };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to delete task";
      return { success: false, message };
    }
  },

  updateTaskStatus: async (id, status) => {
    try {
      const res = await api_client.patch(`/tasks/${id}/status`, { status });
      set({
        items: get().items.map((t) => (t.id === id ? { ...t, status } : t)),
      });
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to update task status";
      return { success: false, message };
    }
  },

  searchTasks: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: null, isSearching: false });
      return;
    }
    set({ isSearching: true });
    try {
      const res = await api_client.get(
        `/search?type=task&value=${encodeURIComponent(query.trim())}`,
      );
      set({
        searchResults: (res.data?.data as TaskListItem[]) ?? [],
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
