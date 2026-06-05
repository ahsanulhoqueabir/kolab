import { create } from "zustand";
import { api_client } from "@/lib/api/api-client";
import { hashFilters, dedupeById } from "@/lib/pagination";
import type { PaginationMeta, PaginatedData, CachedPage } from "@/types/types";

// ─── Types ──────────────────────────────────────────────────────

export interface PaginatedState<T> {
  /** All currently loaded items (accumulated across pages) */
  items: T[];
  /** Current pagination meta from the latest fetch */
  pagination: PaginationMeta | null;
  /** Loading flag */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Cache of fetched pages: key = filterHash|page|pageSize */
  pageCache: Map<string, CachedPage<T>>;
  /** Tracks which filter-hashes have been fully fetched (all pages loaded) */
  fullyLoadedFilters: Set<string>;
  /** Current filter hash being used */
  currentFilterHash: string;
}

export interface PaginatedActions<T> {
  /**
   * Fetch a specific page. If the page is already cached for the current
   * filter set, returns cached data (unless forceRefresh is true).
   * On success, items are merged with deduplication.
   */
  fetchPage: (
    endpoint: string,
    filters: Record<string, unknown>,
    page: number,
    pageSize: number,
    options?: { forceRefresh?: boolean },
  ) => Promise<void>;

  /**
   * Refresh the current page (force re-fetch). Resets everything.
   */
  refresh: (
    endpoint: string,
    filters: Record<string, unknown>,
    page: number,
    pageSize: number,
  ) => Promise<void>;

  /** Go to a specific page — uses cache if available */
  goToPage: (
    endpoint: string,
    filters: Record<string, unknown>,
    page: number,
    pageSize: number,
  ) => Promise<void>;

  /** Go to next page */
  nextPage: (
    endpoint: string,
    filters: Record<string, unknown>,
    pageSize: number,
  ) => Promise<void>;

  /** Go to previous page */
  prevPage: (
    endpoint: string,
    filters: Record<string, unknown>,
    pageSize: number,
  ) => Promise<void>;

  /** Clear all cached data and reset state */
  clearCache: () => void;

  /** Remove a single item from local state (after delete) */
  removeItem: (id: string | number) => void;

  /** Add or update a single item in local state */
  upsertItem: (item: T & { id: string | number }) => void;
}

export type PaginatedStore<T> = PaginatedState<T> & PaginatedActions<T>;

// ─── Default state ──────────────────────────────────────────────

function defaultState<T>(): PaginatedState<T> {
  return {
    items: [],
    pagination: null,
    isLoading: false,
    error: null,
    pageCache: new Map(),
    fullyLoadedFilters: new Set(),
    currentFilterHash: "",
  };
}

// ─── Store factory ──────────────────────────────────────────────

interface CreatePaginatedStoreOptions {
  /** Max number of cached pages per filter hash (to prevent memory bloat) */
  maxPagesPerFilter?: number;
}

/**
 * Creates a Zustand store slice with pagination, caching, and dedup.
 *
 * Usage:
 * ```
 * const useMyStore = createPaginatedStore<MyItem>();
 * // In component:
 * const { items, pagination, fetchPage } = useMyStore();
 * ```
 */
export function createPaginatedStore<T extends { id: string | number }>(
  options: CreatePaginatedStoreOptions = {},
) {
  const { maxPagesPerFilter = 50 } = options;

  return create<PaginatedStore<T>>((set, get) => ({
    ...defaultState<T>(),

    fetchPage: async (endpoint, filters, page, pageSize, opts) => {
      const filterHash = hashFilters(filters);
      const cacheKey = `${filterHash}|p${page}|s${pageSize}`;
      const state = get();

      // ── Check cache (unless force refresh) ──
      if (!opts?.forceRefresh) {
        const cached = state.pageCache.get(cacheKey);
        if (cached) {
          // Restore items for this filter hash from cache
          const allCachedPages = Array.from(state.pageCache.values()).filter(
            (cp) => {
              const cpHash = hashFilters({});
              // Reconstruct filter hash from cached items — we store it alongside
              return true; // We'll handle this differently
            },
          );

          set({
            items: cached.items,
            pagination: cached.pagination,
            currentFilterHash: filterHash,
            isLoading: false,
          });
          return;
        }
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
        const res = await api_client.get(`${endpoint}?${query}`);
        const responseData = res.data?.data as PaginatedData<T> | undefined;

        if (!responseData) {
          set({
            items: [],
            pagination: null,
            isLoading: false,
            error: "Invalid response format",
          });
          return;
        }

        const { items: newItems, pagination: paginationMeta } = responseData;

        // ── Update page cache ──
        const cachedPage: CachedPage<T> = {
          items: newItems,
          pagination: paginationMeta,
          fetchedAt: Date.now(),
        };

        const newPageCache = new Map(state.pageCache);
        // Limit cache size per filter hash
        const keysForHash = Array.from(newPageCache.keys()).filter((k) =>
          k.startsWith(`${filterHash}|`),
        );
        if (keysForHash.length >= maxPagesPerFilter) {
          // Remove oldest entry for this hash
          const oldest = keysForHash.sort((a, b) => {
            const aCp = newPageCache.get(a);
            const bCp = newPageCache.get(b);
            return (aCp?.fetchedAt ?? 0) - (bCp?.fetchedAt ?? 0);
          })[0];
          if (oldest) newPageCache.delete(oldest);
        }
        newPageCache.set(cacheKey, cachedPage);

        // ── Build accumulated items from all cached pages for this filter hash ──
        const allItemsForHash: T[] = [];
        Array.from(newPageCache.entries())
          .filter(([k]) => k.startsWith(`${filterHash}|`))
          .sort(([a], [b]) => {
            const aPage = parseInt(a.split("|p")[1]?.split("|")[0] || "0", 10);
            const bPage = parseInt(b.split("|p")[1]?.split("|")[0] || "0", 10);
            return aPage - bPage;
          })
          .forEach(([, cp]) => {
            allItemsForHash.push(...cp.items);
          });

        const dedupedItems = dedupeById(allItemsForHash);

        // ── Check if all pages are loaded ──
        const loadedPagesForHash = new Set(
          Array.from(newPageCache.keys())
            .filter((k) => k.startsWith(`${filterHash}|`))
            .map((k) => parseInt(k.split("|p")[1]?.split("|")[0] || "0", 10)),
        );

        const newFullyLoaded = new Set(state.fullyLoadedFilters);
        let allLoaded = true;
        for (let i = 1; i <= paginationMeta.totalPages; i++) {
          if (!loadedPagesForHash.has(i)) {
            allLoaded = false;
            break;
          }
        }
        if (allLoaded) {
          newFullyLoaded.add(filterHash);
        } else {
          newFullyLoaded.delete(filterHash);
        }

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
            ?.error || "Failed to fetch data";
        set({ error: message, isLoading: false });
      }
    },

    refresh: async (endpoint, filters, page, pageSize) => {
      const filterHash = hashFilters(filters);
      const state = get();

      // Clear cache for this filter hash
      const newPageCache = new Map(state.pageCache);
      Array.from(newPageCache.keys())
        .filter((k) => k.startsWith(`${filterHash}|`))
        .forEach((k) => newPageCache.delete(k));

      const newFullyLoaded = new Set(state.fullyLoadedFilters);
      newFullyLoaded.delete(filterHash);

      set({
        pageCache: newPageCache,
        fullyLoadedFilters: newFullyLoaded,
      });

      await get().fetchPage(endpoint, filters, page, pageSize, {
        forceRefresh: true,
      });
    },

    goToPage: async (endpoint, filters, page, pageSize) => {
      const filterHash = hashFilters(filters);
      const state = get();
      const cacheKey = `${filterHash}|p${page}|s${pageSize}`;
      const cached = state.pageCache.get(cacheKey);

      if (cached) {
        // Restore items from cache and show cached page
        set({
          pagination: {
            ...cached.pagination,
            currentPage: page,
          },
          isLoading: false,
        });
        return;
      }

      await get().fetchPage(endpoint, filters, page, pageSize);
    },

    nextPage: async (endpoint, filters, pageSize) => {
      const state = get();
      const next = (state.pagination?.currentPage ?? 1) + 1;
      if (state.pagination && next > state.pagination.totalPages) return;
      await get().goToPage(endpoint, filters, next, pageSize);
    },

    prevPage: async (endpoint, filters, pageSize) => {
      const state = get();
      const prev = (state.pagination?.currentPage ?? 1) - 1;
      if (prev < 1) return;
      await get().goToPage(endpoint, filters, prev, pageSize);
    },

    clearCache: () => {
      set(defaultState<T>());
    },

    removeItem: (id) => {
      const state = get();
      set({
        items: state.items.filter((item) => item.id !== id),
      });
    },

    upsertItem: (item) => {
      const state = get();
      const exists = state.items.some((i) => i.id === item.id);
      if (exists) {
        set({
          items: state.items.map((i) => (i.id === item.id ? item : i)),
        });
      } else {
        set({ items: [item, ...state.items] });
      }
    },
  }));
}
