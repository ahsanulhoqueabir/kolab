export type ContextType = {
  params: {
    [key: string]: string;
  };
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * Standard pagination metadata returned by all list endpoints.
 */
export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Wraps list data + pagination meta for consistent API responses.
 */
export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Cache key for tracking fetched pages in stores.
 */
export interface PageCacheKey {
  /** Unique identifier for the filter combination (JSON-stringified filters) */
  filterHash: string;
  /** Page number */
  page: number;
  /** Page size */
  pageSize: number;
}

/**
 * Cached page entry stored in the store.
 */
export interface CachedPage<T> {
  items: T[];
  pagination: PaginationMeta;
  fetchedAt: number;
}
