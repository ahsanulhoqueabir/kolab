import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/core/ui/card";

interface SkeletonProps {
  className?: string;
}

/**
 * A single skeleton block for loading placeholders.
 */
function SkeletonBlock({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

/**
 * Table row skeleton — renders a row with configurable columns.
 */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-3">
          <SkeletonBlock className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Card skeleton — mimics a card with header and content.
 */
export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <SkeletonBlock className="h-5 w-1/3" />
        <SkeletonBlock className="h-4 w-1/2 mt-1" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonBlock key={i} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Mobile Card Skeleton ────────────────────────────────────────────

/**
 * A single mobile card skeleton item — mimics a card in mobile grid view.
 */
export function MobileCardItemSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-5 w-2/5" />
        <SkeletonBlock className="h-5 w-5 rounded-full" />
      </div>
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-4 w-1/2" />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <SkeletonBlock className="h-8 w-16 rounded-md" />
        <SkeletonBlock className="h-8 w-16 rounded-md" />
      </div>
    </div>
  );
}

/**
 * Mobile skeleton grid — mimics the mobile card layout of ListPage.
 */
export function MobileListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <MobileCardItemSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Search & Filter Bar Skeleton ────────────────────────────────────

/**
 * Search & filter bar skeleton — mimics the search input + filter dropdowns.
 */
export function SearchFilterSkeleton({
  filterCount = 2,
}: {
  filterCount?: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search input */}
      <SkeletonBlock className="h-9 w-full max-w-sm rounded-md" />

      {/* Filter dropdowns */}
      {Array.from({ length: filterCount }).map((_, i) => (
        <SkeletonBlock key={i} className="h-9 w-44 rounded-md" />
      ))}
    </div>
  );
}

// ─── Pagination Skeleton ─────────────────────────────────────────────

/**
 * Pagination skeleton — mimics the full pagination bar.
 */
export function PaginationSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-4">
      {/* Info text */}
      <SkeletonBlock className="h-4 w-32 order-2 sm:order-1" />

      {/* Page buttons */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <SkeletonBlock className="h-8 w-8 rounded-md hidden sm:block" />
        <SkeletonBlock className="h-8 w-8 rounded-md" />
        <SkeletonBlock className="h-8 w-8 rounded-md hidden sm:block" />
        <SkeletonBlock className="h-8 w-8 rounded-md hidden sm:block" />
        <SkeletonBlock className="h-8 w-8 rounded-md hidden sm:block" />
        <SkeletonBlock className="h-8 w-8 rounded-md" />
        <SkeletonBlock className="h-8 w-8 rounded-md hidden sm:block" />
        {/* Quick jumper */}
        <SkeletonBlock className="h-8 w-20 rounded-md ml-2" />
      </div>
    </div>
  );
}

// ─── Bulk Action Bar Skeleton ────────────────────────────────────────

/**
 * Bulk action bar skeleton — mimics the selected-items action bar.
 */
export function BulkActionBarSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-8 w-28 rounded-md" />
      </div>
      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-8 w-20 rounded-md" />
        <SkeletonBlock className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
}

// ─── List Page Skeleton (Full) ───────────────────────────────────────

/**
 * ListPage skeleton — fully mirrors the ListPage component layout including
 * header, search bar, filters, table (with checkbox + action columns),
 * mobile cards, bulk action bar, and pagination.
 *
 * Use this directly in any page that uses `<ListPage>` to show a structured
 * loading placeholder while data is being fetched.
 */
export function ListPageSkeleton({
  rows = 5,
  columns = 4,
  filterCount = 2,
  showBulkActions = false,
  showPagination = true,
  showMobileView = true,
}: {
  rows?: number;
  columns?: number;
  filterCount?: number;
  showBulkActions?: boolean;
  showPagination?: boolean;
  showMobileView?: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-48" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-10 w-28 rounded-md" />
          <SkeletonBlock className="h-10 w-36 rounded-md" />
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <SearchFilterSkeleton filterCount={filterCount} />

      {/* ── Desktop Table ── */}
      <div className="hidden md:block rounded-md border bg-card text-card-foreground">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {showBulkActions && (
                <th className="w-10 p-3">
                  <SkeletonBlock className="h-4 w-4 rounded-sm" />
                </th>
              )}
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="p-3">
                  <SkeletonBlock className="h-4 w-24" />
                </th>
              ))}
              {/* Actions column */}
              <th className="w-14 p-3">
                <SkeletonBlock className="h-4 w-10 ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx} className="border-b">
                {showBulkActions && (
                  <td className="p-3">
                    <SkeletonBlock className="h-4 w-4 rounded-sm" />
                  </td>
                )}
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td key={colIdx} className="p-3">
                    <SkeletonBlock
                      className={cn("h-4", colIdx === 0 ? "w-3/5" : "w-full")}
                    />
                  </td>
                ))}
                {/* Actions button skeleton */}
                <td className="p-3 text-right">
                  <SkeletonBlock className="h-8 w-8 rounded-md ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Card View ── */}
      {showMobileView && (
        <div className="md:hidden">
          <MobileListSkeleton rows={rows} />
        </div>
      )}

      {/* ── Bulk Action Bar ── */}
      {showBulkActions && <BulkActionBarSkeleton />}

      {/* ── Pagination ── */}
      {showPagination && <PaginationSkeleton />}
    </div>
  );
}

/**
 * Form skeleton — mimics a form with multiple fields.
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <Card>
      <CardHeader>
        <SkeletonBlock className="h-5 w-1/3" />
        <SkeletonBlock className="h-4 w-1/2 mt-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="h-9 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export { SkeletonBlock as Skeleton };
