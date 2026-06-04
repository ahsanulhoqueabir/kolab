"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  showQuickJumper?: boolean;
  totalItems?: number;
  className?: string;
}

/**
 * Reusable pagination component with page size selector.
 *
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={page}
 *   totalPages={totalPages}
 *   onPageChange={setPage}
 *   pageSize={pageSize}
 *   pageSizeOptions={[5, 10, 20, 50]}
 *   onPageSizeChange={setPageSize}
 *   showPageSizeSelector
 *   totalItems={total}
 * />
 * ```
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  onPageSizeChange,
  showPageSizeSelector = false,
  showQuickJumper = false,
  totalItems,
  className,
}: PaginationProps) {
  const [jumpValue, setJumpValue] = React.useState("");

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(jumpValue, 10);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpValue("");
    }
  };

  if (totalPages <= 1 && !showPageSizeSelector) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4",
        className,
      )}
    >
      {/* Page info */}
      <div className="text-sm text-muted-foreground">
        {totalItems !== undefined && (
          <span>
            {totalItems} total items
            {showPageSizeSelector && " · "}
          </span>
        )}
        {showPageSizeSelector && onPageSizeChange && (
          <span className="inline-flex items-center gap-1">
            <span>Show</span>
            <select
              className="h-7 rounded border border-input bg-background px-1 text-xs"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>per page</span>
          </span>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {generatePageNumbers(currentPage, totalPages).map((page, idx) =>
            page === "..." ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-1 text-muted-foreground"
              >
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="min-w-8 h-8"
                onClick={() => onPageChange(page as number)}
              >
                {page}
              </Button>
            ),
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Quick jumper */}
        {showQuickJumper && totalPages > 5 && (
          <form onSubmit={handleJump} className="flex items-center gap-1 ml-2">
            <span className="text-xs text-muted-foreground">Go to</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              className="h-7 w-14 rounded border border-input bg-background px-1 text-xs text-center"
              placeholder=""
            />
          </form>
        )}
      </div>
    </div>
  );
}

function generatePageNumbers(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push("...");
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1);
    pages.push("...");
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push("...");
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push("...");
    pages.push(total);
  }

  return pages;
}
