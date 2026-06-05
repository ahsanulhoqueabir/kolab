/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import {
  Search,
  RefreshCw,
  Edit,
  Trash2,
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/core/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/core/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/core/ui/dropdown-menu";
import { Checkbox } from "@/components/core/ui/checkbox";
import { cn } from "@/lib/utils";
import { ListPageHeader } from "@/components/core/shared/ListPageHeader";
import {
  ListPageSkeleton,
  MobileListSkeleton,
} from "@/components/core/shared/LoadingSkeleton";

export interface ListPageColumn<T> {
  key: string;
  label: string;
  width?: number;
  sortable?: boolean;
  searchable?: boolean;
  className?: string;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface ListPageFilterOption {
  label: string;
  value: string;
}

export interface ListPageFilter {
  key: string;
  label: string;
  placeholder: string;
  options: ListPageFilterOption[];
  /** If true, fetches options dynamically via onFilterOpen */
  dynamic?: boolean;
}

export interface ListPageConfig<T> {
  resource: string;
  title: string;
  description?: string;
  columns: ListPageColumn<T>[];
  search?: {
    fields: string[];
    placeholder?: string;
  };
  filters?: ListPageFilter[];
  /** Called when a filter value changes. Receives a record of { filterKey: value } */
  onFilterChange?: (filters: Record<string, string>) => void;
  /** Called when a dynamic filter dropdown opens — returns available options */
  onFilterOpen?: (filterKey: string) => Promise<ListPageFilterOption[]>;
  actions?: {
    default?: ("edit" | "delete" | "view")[];
    pageActions?: {
      label: string;
      icon: any;
      variant?: any;
      onClick: () => void;
    }[];
    bulk?: {
      enabled: boolean;
      position?: "top" | "bottom";
      showClearButton?: boolean;
      actions: {
        label: string;
        icon: any;
        variant?: any;
        onClick: (selectedIds: string[]) => void;
        confirmMessage?: string;
        requireSelection?: boolean;
      }[];
    };
  };
  pagination?: {
    pageSize: number;
    pageSizeOptions?: number[];
    showPageSizeSelector?: boolean;
    showQuickJumper?: boolean;
    /** Current page number (from server meta) */
    currentPage?: number;
    /** Total pages (from server meta) */
    totalPages?: number;
    /** Whether there is a next page */
    hasNext?: boolean;
    /** Whether there is a previous page */
    hasPrev?: boolean;
    /** Total record count */
    total?: number;
    /** Called when navigating to a specific page */
    onNextPage?: () => void;
    /** Called when navigating to the previous page */
    onPrevPage?: () => void;
    /** Called when navigating to a specific page number */
    onGoToPage?: (page: number) => void;
  };
  onRefresh?: () => Promise<void>;
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  onView?: (item: T) => void;
}

interface ListPageProps<T> {
  data: T[];
  loading?: boolean;
  error?: string | null;
  config: ListPageConfig<T>;
  mobileRender?: (item: T) => React.ReactNode;
}

export function ListPage<T extends { id?: string | number }>({
  data,
  loading,
  error,
  config,
  mobileRender,
}: ListPageProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [filterValues, setFilterValues] = React.useState<
    Record<string, string>
  >({});
  const [dynamicOptions, setDynamicOptions] = React.useState<
    Record<string, ListPageFilterOption[]>
  >({});
  const [jumpValue, setJumpValue] = React.useState("");

  const handleFilterChange = (key: string, value: string) => {
    const next = { ...filterValues, [key]: value };
    setFilterValues(next);
    config.onFilterChange?.(next);
  };

  const handleFilterOpen = async (filter: ListPageFilter) => {
    if (filter.dynamic && config.onFilterOpen && !dynamicOptions[filter.key]) {
      const opts = await config.onFilterOpen(filter.key);
      setDynamicOptions((prev) => ({ ...prev, [filter.key]: opts }));
    }
  };

  // Filtering
  const filteredData = React.useMemo(() => {
    let result = [...data];

    if (searchQuery && config.search) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item: any) => {
        return config.search!.fields.some((field) => {
          const val = item[field];
          return val && String(val).toLowerCase().includes(query);
        });
      });
    }

    if (sortKey) {
      result.sort((a: any, b: any) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal === bVal) return 0;
        const comparison = aVal > bVal ? 1 : -1;
        return sortOrder === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchQuery, config.search, sortKey, sortOrder]);

  // Pagination — use server-side meta when available, else client-side
  const isServerPaginated = Boolean(config.pagination?.totalPages);
  const pageSize = config.pagination?.pageSize || 10;
  const totalPages =
    config.pagination?.totalPages ?? Math.ceil(filteredData.length / pageSize);
  const effectiveCurrentPage = config.pagination?.currentPage ?? currentPage;
  const paginatedData = React.useMemo(() => {
    if (isServerPaginated) {
      // Server-side: data is already the current page's items
      return data;
    }
    // Client-side: slice locally
    const start = (effectiveCurrentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [data, filteredData, effectiveCurrentPage, pageSize, isServerPaginated]);

  const toggleSelectAll = (checked: boolean | string) => {
    if (checked) {
      setSelectedIds(paginatedData.map((item) => String(item.id)));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <ListPageHeader
        title={config.title}
        description={config.description}
        actions={
          <>
            {config.onRefresh && (
              <Button
                variant="refresh"
                size="lg"
                onClick={config.onRefresh}
                disabled={loading}
              >
                Refresh
                <RefreshCw
                  className={cn("h-4 w-4", loading && "animate-spin")}
                />
              </Button>
            )}
            {config.actions?.pageActions?.map((action, idx) => {
              const Icon = action.icon;
              const varVal =
                action.variant === "default"
                  ? "create"
                  : action.variant || "create";
              return (
                <Button
                  key={idx}
                  variant={varVal}
                  size="lg"
                  onClick={action.onClick}
                >
                  <Icon className="h-4 w-4 mr-1.5" />
                  {action.label}
                </Button>
              );
            })}
          </>
        }
      />

      {/* Controls — Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {config.search && (
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={config.search.placeholder || "Search..."}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {config.filters?.map((filter) => {
          const currentVal = filterValues[filter.key] || "all";
          const options = filter.dynamic
            ? dynamicOptions[filter.key] || filter.options
            : filter.options;

          return (
            <div
              key={filter.key}
              className="w-44"
              onClick={() => handleFilterOpen(filter)}
            >
              <Select
                value={currentVal}
                onValueChange={(value) => handleFilterChange(filter.key, value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={filter.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{filter.placeholder}</SelectItem>
                  {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border bg-card text-card-foreground">
        {loading ? (
          <div className="p-0">
            <ListPageSkeleton
              rows={pageSize > 5 ? 5 : pageSize}
              columns={config.columns.length}
              filterCount={0}
              showPagination={false}
              showMobileView={false}
              showBulkActions={false}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {config.actions?.bulk?.enabled && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        paginatedData.length > 0 &&
                        selectedIds.length === paginatedData.length
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                {config.columns.map((col) => (
                  <TableHead
                    key={col.key}
                    style={col.width ? { width: `${col.width}%` } : undefined}
                    className={cn(
                      "select-none",
                      col.sortable && "cursor-pointer hover:text-foreground",
                      col.className,
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {col.sortable && <ArrowUpDown className="h-3.5 w-3.5" />}
                    </div>
                  </TableHead>
                ))}
                {config.actions?.default && (
                  <TableHead className="w-14 text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => {
                  const idStr = String(item.id);
                  return (
                    <TableRow key={idStr}>
                      {config.actions?.bulk?.enabled && (
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(idStr)}
                            onCheckedChange={() => toggleSelect(idStr)}
                          />
                        </TableCell>
                      )}
                      {config.columns.map((col) => {
                        const value = (item as any)[col.key];
                        return (
                          <TableCell
                            key={col.key}
                            className={cn("align-middle", col.className)}
                          >
                            {col.render
                              ? col.render(value, item)
                              : String(value ?? "")}
                          </TableCell>
                        );
                      })}
                      {config.actions?.default && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              {config.actions.default.includes("view") &&
                                config.onView && (
                                  <DropdownMenuItem
                                    onClick={() => config.onView!(item)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    <span>View</span>
                                  </DropdownMenuItem>
                                )}
                              {config.actions.default.includes("edit") &&
                                config.onEdit && (
                                  <>
                                    {config.actions.default.includes("view") &&
                                      config.onView && (
                                        <DropdownMenuSeparator />
                                      )}
                                    <DropdownMenuItem
                                      onClick={() => config.onEdit!(item)}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      <span>Edit</span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              {config.actions.default.includes("delete") &&
                                config.onDelete && (
                                  <>
                                    {(config.actions.default.includes("view") ||
                                      config.actions.default.includes(
                                        "edit",
                                      )) && <DropdownMenuSeparator />}
                                    <DropdownMenuItem
                                      onClick={() => config.onDelete!(idStr)}
                                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      <span>Delete</span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Mobile view */}
      {mobileRender && (
        <div className="md:hidden">
          {loading ? (
            <MobileListSkeleton rows={pageSize > 4 ? 4 : pageSize} />
          ) : paginatedData.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No records found
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {paginatedData.map((item) => mobileRender(item))}
            </div>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {config.actions?.bulk?.enabled && selectedIds.length > 0 && (
        <div
          className={cn(
            "flex items-center justify-between rounded-md border bg-muted/40 p-3 text-sm",
            config.actions.bulk.position === "top"
              ? "animate-in slide-in-from-top-2"
              : "animate-in slide-in-from-bottom-2",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {selectedIds.length} item{selectedIds.length > 1 ? "s" : ""}{" "}
              selected
            </span>
            {config.actions.bulk.showClearButton !== false && (
              <Button onClick={() => setSelectedIds([])}>
                Clear selection
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {config.actions.bulk.actions.map((act, idx) => {
              const Icon = act.icon;
              const isDisabled =
                act.requireSelection && selectedIds.length === 0;
              return (
                <Button
                  key={idx}
                  variant={act.variant || "default"}
                  size="sm"
                  disabled={isDisabled}
                  onClick={() => {
                    if (act.confirmMessage) {
                      if (window.confirm(act.confirmMessage)) {
                        act.onClick(selectedIds);
                        setSelectedIds([]);
                      }
                    } else {
                      act.onClick(selectedIds);
                      setSelectedIds([]);
                    }
                  }}
                >
                  <Icon className="h-3.5 w-3.5 mr-1" />
                  {act.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-4">
          {/* Info: showing X-Y of Z */}
          {config.pagination?.total !== undefined && (
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
              {(effectiveCurrentPage - 1) * pageSize + 1}–
              {Math.min(
                effectiveCurrentPage * pageSize,
                config.pagination.total,
              )}{" "}
              of {config.pagination.total}
            </div>
          )}

          {/* Page navigation */}
          <div className="flex items-center gap-1 order-1 sm:order-2">
            {/* First page (desktop only) */}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                if (isServerPaginated) {
                  config.pagination?.onGoToPage?.(1);
                } else {
                  setCurrentPage(1);
                }
              }}
              disabled={effectiveCurrentPage === 1}
              title="First page"
              className="hidden sm:inline-flex"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Previous page */}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                if (isServerPaginated) {
                  config.pagination?.onPrevPage?.();
                } else {
                  setCurrentPage((p) => Math.max(1, p - 1));
                }
              }}
              disabled={effectiveCurrentPage === 1}
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers (desktop only) */}
            <div className="hidden sm:flex items-center gap-1">
              {generatePageNumbers(effectiveCurrentPage, totalPages).map(
                (page, idx) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={
                        effectiveCurrentPage === page ? "default" : "outline"
                      }
                      size="icon-sm"
                      className="min-w-8 h-8 text-xs"
                      onClick={() => {
                        if (isServerPaginated) {
                          config.pagination?.onGoToPage?.(page as number);
                        } else {
                          setCurrentPage(page as number);
                        }
                      }}
                    >
                      {page}
                    </Button>
                  ),
              )}
            </div>

            {/* Mobile: current page indicator */}
            <span className="sm:hidden text-xs text-muted-foreground px-2 select-none">
              {effectiveCurrentPage} / {totalPages}
            </span>

            {/* Next page */}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                if (isServerPaginated) {
                  config.pagination?.onNextPage?.();
                } else {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                }
              }}
              disabled={effectiveCurrentPage === totalPages}
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last page (desktop only) */}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                if (isServerPaginated) {
                  config.pagination?.onGoToPage?.(totalPages);
                } else {
                  setCurrentPage(totalPages);
                }
              }}
              disabled={effectiveCurrentPage === totalPages}
              title="Last page"
              className="hidden sm:inline-flex"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>

            {/* Quick jumper */}
            {config.pagination?.showQuickJumper && totalPages > 5 && (
              <div className="flex items-center gap-1 ml-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Go to
                </span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpValue}
                  onChange={(e) => setJumpValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const p = parseInt(jumpValue, 10);
                      if (p >= 1 && p <= totalPages) {
                        if (isServerPaginated) {
                          config.pagination?.onGoToPage?.(p);
                        } else {
                          setCurrentPage(p);
                        }
                        setJumpValue("");
                      }
                    }
                  }}
                  className="h-8 w-14 rounded-md border border-input bg-background px-1 text-xs text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder=""
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
