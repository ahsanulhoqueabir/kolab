import { useState, useCallback } from "react";

/**
 * A reusable filter state management hook.
 * Manages a set of filter key-value pairs and provides helpers
 * to set, clear, or reset individual filters.
 *
 * @example
 * ```tsx
 * const { filters, setFilter, clearFilter, resetFilters, activeCount } = useFilter({
 *   status: "",
 *   priority: "",
 *   project: "",
 * });
 *
 * // Apply filters to API call
 * useEffect(() => {
 *   fetchTasks({ status: filters.status || undefined, ... });
 * }, [filters]);
 * ```
 */
export function useFilter<T extends Record<string, string>>(initialFilters: T) {
  const [filters, setFilters] = useState<T>({ ...initialFilters });

  /**
   * Set a single filter value.
   */
  const setFilter = useCallback((key: keyof T, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Clear a single filter back to its initial value.
   */
  const clearFilter = useCallback(
    (key: keyof T) => {
      setFilters((prev) => ({
        ...prev,
        [key]: initialFilters[key],
      }));
    },
    [initialFilters],
  );

  /**
   * Reset all filters to their initial values.
   */
  const resetFilters = useCallback(() => {
    setFilters({ ...initialFilters });
  }, [initialFilters]);

  /**
   * Number of active (non-empty, non-default) filters.
   */
  const activeCount = Object.entries(filters).filter(([key, value]) => {
    return value !== "" && value !== initialFilters[key];
  }).length;

  /**
   * Get only active (non-empty) filter values for API calls.
   */
  const getActiveFilters = useCallback((): Partial<T> => {
    const active: Partial<T> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value !== "" && value !== initialFilters[key]) {
        (active as Record<string, string>)[key] = value;
      }
    }
    return active;
  }, [filters, initialFilters]);

  return {
    filters,
    setFilter,
    clearFilter,
    resetFilters,
    activeCount,
    getActiveFilters,
  };
}
