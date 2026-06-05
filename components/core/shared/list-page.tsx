/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import {
  Search,
  RefreshCw,
  Edit,
  Trash2,
  ArrowUpDown,
  Eye,
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
import { cn } from "@/lib/utils";
import { ListPageHeader } from "@/components/core/shared/ListPageHeader";

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

  // Pagination
  const pageSize = config.pagination?.pageSize || 10;
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedData.map((item) => String(item.id)));
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
        <table className="w-full text-sm border-collapse text-left">
          <thead>
            <tr className="border-b bg-muted/50 transition-colors">
              {config.actions?.bulk?.enabled && (
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedData.length > 0 &&
                      selectedIds.length === paginatedData.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              {config.columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: `${col.width}%` } : undefined}
                  className={cn(
                    "p-3 font-medium text-muted-foreground select-none",
                    col.sortable && "cursor-pointer hover:text-foreground",
                    col.className,
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && <ArrowUpDown className="h-3.5 w-3.5" />}
                  </div>
                </th>
              ))}
              {config.actions?.default && (
                <th className="p-3 w-24 text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={10}
                  className="p-8 text-center text-muted-foreground"
                >
                  Loading data...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="p-8 text-center text-muted-foreground"
                >
                  No records found
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => {
                const idStr = String(item.id);
                return (
                  <tr
                    key={idStr}
                    className="border-b transition-colors hover:bg-muted/30"
                  >
                    {config.actions?.bulk?.enabled && (
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(idStr)}
                          onChange={() => toggleSelect(idStr)}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    {config.columns.map((col) => {
                      const value = (item as any)[col.key];
                      return (
                        <td
                          key={col.key}
                          className={cn("p-3 align-middle", col.className)}
                        >
                          {col.render
                            ? col.render(value, item)
                            : String(value ?? "")}
                        </td>
                      );
                    })}
                    {config.actions?.default && (
                      <td className="p-3 align-middle text-right space-x-1">
                        {config.actions.default.includes("view") &&
                          config.onView && (
                            <Button
                              variant="outline"
                              size="icon-xs"
                              onClick={() => config.onView!(item)}
                              title="View"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        {config.actions.default.includes("edit") &&
                          config.onEdit && (
                            <Button
                              variant="edit"
                              size="icon-xs"
                              onClick={() => config.onEdit!(item)}
                              title="Edit"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        {config.actions.default.includes("delete") &&
                          config.onDelete && (
                            <Button
                              variant="delete"
                              size="icon-xs"
                              onClick={() => config.onDelete!(idStr)}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile view */}
      {mobileRender && (
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {loading ? (
            <div className="text-center p-8 text-muted-foreground">
              Loading...
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No records found
            </div>
          ) : (
            paginatedData.map((item) => mobileRender(item))
          )}
        </div>
      )}

      {/* Bulk action bar (if bottom) */}
      {config.actions?.bulk?.enabled && selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3 text-sm animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {selectedIds.length} items selected
            </span>
            {config.actions.bulk.showClearButton && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setSelectedIds([])}
              >
                Clear
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {config.actions.bulk.actions.map((act, idx) => {
              const Icon = act.icon;
              return (
                <Button
                  key={idx}
                  variant={act.variant || "default"}
                  size="xs"
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
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="text-sm font-medium text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
