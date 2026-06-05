"use client";

import * as React from "react";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SortOption {
  key: string;
  label: string;
}

interface SortDropdownProps {
  options: SortOption[];
  sortKey: string;
  sortOrder: "asc" | "desc";
  onSortChange: (key: string, order: "asc" | "desc") => void;
  className?: string;
}

/**
 * Sort dropdown with ascending/descending toggle.
 *
 * @example
 * ```tsx
 * const [sortKey, setSortKey] = useState("created_at")
 * const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
 *
 * <SortDropdown
 *   options={[
 *     { key: "created_at", label: "Latest" },
 *     { key: "deadline", label: "Deadline" },
 *   ]}
 *   sortKey={sortKey}
 *   sortOrder={sortOrder}
 *   onSortChange={(key, order) => { setSortKey(key); setSortOrder(order); }}
 * />
 * ```
 */
export function SortDropdown({
  options,
  sortKey,
  sortOrder,
  onSortChange,
  className,
}: SortDropdownProps) {
  const currentLabel = options.find((o) => o.key === sortKey)?.label || "Sort";

  const handleKeyChange = (newKey: string) => {
    onSortChange(newKey, sortOrder);
  };

  const toggleOrder = () => {
    onSortChange(sortKey, sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <select
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        value={sortKey}
        onChange={(e) => handleKeyChange(e.target.value)}
        aria-label="Sort by"
      >
        {options.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={toggleOrder}
        className="h-9 w-9 rounded-md border border-input bg-background flex items-center justify-center hover:bg-muted transition-colors"
        title={sortOrder === "asc" ? "Ascending" : "Descending"}
      >
        <ArrowUpDown
          className={cn(
            "h-4 w-4 text-muted-foreground",
            sortOrder === "asc" && "rotate-180",
          )}
        />
      </button>
    </div>
  );
}
