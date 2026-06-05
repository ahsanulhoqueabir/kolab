import type {
  PaginationMeta,
  PaginatedData,
  PageCacheKey,
  CachedPage,
} from "@/types/types";

/**
 * Build PaginationMeta from raw count/page/pageSize values.
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    currentPage: page,
    pageSize,
    totalPages,
    total,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Wrap items + pagination meta into a standard PaginatedData envelope.
 */
export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedData<T> {
  return {
    items,
    pagination: buildPaginationMeta(total, page, pageSize),
  };
}

// ─── Client-side page-cache helpers ────────────────────────────

/**
 * Generate a deterministic filter-hash from a filters object.
 * Sorts keys so the same filters always produce the same hash.
 */
export function hashFilters(filters: Record<string, unknown>): string {
  const sorted = Object.keys(filters)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const val = filters[key];
      if (val !== undefined && val !== null && val !== "") {
        acc[key] = val;
      }
      return acc;
    }, {});
  return JSON.stringify(sorted);
}

/**
 * Build a PageCacheKey for a given filter set + page + pageSize.
 */
export function buildPageCacheKey(
  filters: Record<string, unknown>,
  page: number,
  pageSize: number,
): PageCacheKey {
  return {
    filterHash: hashFilters(filters),
    page,
    pageSize,
  };
}

/**
 * Serialise a PageCacheKey to a string for use as a Map key.
 */
export function pageCacheKeyToString(key: PageCacheKey): string {
  return `${key.filterHash}|p${key.page}|s${key.pageSize}`;
}

/**
 * Deduplicate an array of items by their `id` property.
 * Later occurrences overwrite earlier ones.
 */
export function dedupeById<T extends { id: string | number }>(items: T[]): T[] {
  const map = new Map<string | number, T>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

/**
 * Merge a freshly-fetched page into an existing sorted cache.
 * Handles deduplication and preserves order.
 */
export function mergePageIntoCache<T extends { id: string | number }>(
  existing: CachedPage<T>[],
  newPage: CachedPage<T>,
): CachedPage<T>[] {
  const existingMap = new Map<string, CachedPage<T>>();
  for (const cp of existing) {
    const key = pageCacheKeyToString({
      filterHash: cp.pagination.currentPage.toString(),
      page: cp.pagination.currentPage,
      pageSize: cp.pagination.pageSize,
    });
    existingMap.set(key, cp);
  }

  const newKey = pageCacheKeyToString({
    filterHash: newPage.pagination.currentPage.toString(),
    page: newPage.pagination.currentPage,
    pageSize: newPage.pagination.pageSize,
  });
  existingMap.set(newKey, newPage);

  return Array.from(existingMap.values()).sort(
    (a, b) => a.pagination.currentPage - b.pagination.currentPage,
  );
}
