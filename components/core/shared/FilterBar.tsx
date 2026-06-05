"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface FilterBarProps {
  filters: FilterOption[];
  onReset?: () => void;
  activeCount?: number;
  className?: string;
}

/**
 * Reusable filter bar component.
 * Supports multiple filter dropdowns and a reset button.
 *
 * @example
 * ```tsx
 * <FilterBar
 *   filters={[
 *     {
 *       key: "status",
 *       label: "Status",
 *       value: statusFilter,
 *       onChange: setStatusFilter,
 *       options: [
 *         { value: "", label: "All Statuses" },
 *         { value: "ACTIVE", label: "Active" },
 *       ],
 *     },
 *   ]}
 *   activeCount={activeFilterCount}
 *   onReset={resetFilters}
 * />
 * ```
 */
export function FilterBar({
  filters,
  onReset,
  activeCount = 0,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

      {filters.map((filter) => (
        <select
          key={filter.key}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-35"
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          aria-label={filter.label}
        >
          <option value="">
            {filter.placeholder || `All ${filter.label}s`}
          </option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {activeCount > 0 && onReset && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-xs gap-1"
        >
          <X className="h-3 w-3" />
          Clear filters ({activeCount})
        </Button>
      )}
    </div>
  );
}
