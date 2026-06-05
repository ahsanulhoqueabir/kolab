"use client";

import { Layers, CheckSquare, Square } from "lucide-react";
import { PAGE_TO_RESOURCE_PERMISSION_MAP } from "@/config/permission.config";
import {
  getPagesByCategory,
  deduplicatePermissions,
} from "@/lib/business/permission";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/core/ui/tabs";
import { Badge } from "@/components/core/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";

interface PagePermissionSelectorProps {
  selectedPages: string[];
  onPagesChange: (pages: string[]) => void;
  onPermissionsChange: (permissions: React.SetStateAction<string[]>) => void;
  disabled?: boolean;
}

export function PagePermissionSelector({
  selectedPages,
  onPagesChange,
  onPermissionsChange,
  disabled,
}: PagePermissionSelectorProps) {
  const pagesByCategory = useMemo(() => {
    return getPagesByCategory();
  }, []);

  const categoryNames = useMemo(() => {
    return Object.keys(pagesByCategory);
  }, [pagesByCategory]);

  // Derive active category — if current one no longer exists, fall back to first
  const [activeCategory, setActiveCategory] = useState<string>("");

  // Use a ref to track whether we've initialized
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && categoryNames.length > 0) {
      setActiveCategory(categoryNames[0]);
      initialized.current = true;
    } else if (
      initialized.current &&
      categoryNames.length > 0 &&
      !categoryNames.includes(activeCategory)
    ) {
      setActiveCategory(categoryNames[0]);
    }
  }, [categoryNames, activeCategory]);

  const handlePageToggle = (url: string, checked: boolean) => {
    if (disabled) return;

    let nextPages: string[];
    if (checked) {
      nextPages = [...selectedPages, url];
      // Auto-enable resource permissions required by this page
      const requiredPermissions = PAGE_TO_RESOURCE_PERMISSION_MAP[url] || [];
      if (requiredPermissions.length > 0) {
        onPermissionsChange((prev) => {
          return deduplicatePermissions([...prev, ...requiredPermissions]);
        });
      }
    } else {
      nextPages = selectedPages.filter((x) => x !== url);
    }

    onPagesChange(nextPages);
  };

  const handleSelectAllInCategory = (category: string) => {
    const pages = pagesByCategory[category] || [];
    const urls = pages.map((p) => p.url);
    const newPages = deduplicatePermissions([...selectedPages, ...urls]);
    onPagesChange(newPages);

    // Auto-enable all required permissions
    const allRequiredPerms = urls.flatMap(
      (url) => PAGE_TO_RESOURCE_PERMISSION_MAP[url] || [],
    );
    if (allRequiredPerms.length > 0) {
      onPermissionsChange((prev) => {
        return deduplicatePermissions([...prev, ...allRequiredPerms]);
      });
    }
  };

  const handleDeselectAllInCategory = (category: string) => {
    const pages = pagesByCategory[category] || [];
    const urls = new Set(pages.map((p) => p.url));
    const newPages = selectedPages.filter((url) => !urls.has(url));
    onPagesChange(newPages);
  };

  const getCategorySelectedCount = (category: string): number => {
    const pages = pagesByCategory[category] || [];
    return pages.filter((p) => selectedPages.includes(p.url)).length;
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Page Permissions
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Select the pages this role has access to. Enabling a page
          automatically grants its required resource permissions.
        </p>
      </div>

      <Tabs
        value={activeCategory}
        onValueChange={setActiveCategory}
        className="p-4"
      >
        <div className="overflow-x-auto pb-2">
          <TabsList className="w-full h-11 inline-flex">
            {categoryNames.map((category) => {
              const count = getCategorySelectedCount(category);
              return (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="flex-1 gap-2 h-10 py-1 items-center whitespace-nowrap"
                >
                  {category}
                  {count > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {categoryNames.map((category) => {
          const pages = pagesByCategory[category] || [];
          const selectedCount = getCategorySelectedCount(category);

          return (
            <TabsContent key={category} value={category} className="mt-4">
              {/* Category-level bulk actions */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {selectedCount} of {pages.length} page
                  {pages.length > 1 ? "s" : ""} selected
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelectAllInCategory(category)}
                    className="text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Select All
                  </button>
                  <span className="text-xs text-muted-foreground">|</span>
                  <button
                    type="button"
                    disabled={disabled || selectedCount === 0}
                    onClick={() => handleDeselectAllInCategory(category)}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Tabular layout */}
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="p-3 w-10"></th>
                      <th className="p-3 font-medium text-muted-foreground">
                        Page
                      </th>
                      <th className="p-3 font-medium text-muted-foreground hidden sm:table-cell">
                        URL
                      </th>
                      <th className="p-3 font-medium text-muted-foreground hidden md:table-cell">
                        Required Permissions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map((page) => {
                      const isChecked = selectedPages.includes(page.url);
                      const requiredPerms =
                        PAGE_TO_RESOURCE_PERMISSION_MAP[page.url] || [];

                      return (
                        <tr
                          key={page.id}
                          className={cn(
                            "border-b hover:bg-muted/10 transition-colors",
                            isChecked && "bg-primary/5",
                          )}
                        >
                          <td className="p-3 align-middle text-center">
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() =>
                                handlePageToggle(page.url, !isChecked)
                              }
                              className={cn(
                                "text-muted-foreground hover:text-primary transition-colors",
                                isChecked && "text-primary",
                                disabled && "opacity-50 cursor-not-allowed",
                              )}
                            >
                              {isChecked ? (
                                <CheckSquare className="h-5 w-5" />
                              ) : (
                                <Square className="h-5 w-5" />
                              )}
                            </button>
                          </td>
                          <td className="p-3 align-middle">
                            <div>
                              <span className="font-medium">{page.label}</span>
                              {page.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {page.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 align-middle hidden sm:table-cell">
                            <code className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {page.url}
                            </code>
                          </td>
                          <td className="p-3 align-middle hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {requiredPerms.length > 0 ? (
                                requiredPerms.map((perm) => (
                                  <Badge
                                    key={perm}
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    {perm}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  None
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
