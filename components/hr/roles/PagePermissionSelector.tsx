"use client"

import * as React from "react"
import { Layers } from "lucide-react"
import { PAGE_TO_RESOURCE_PERMISSION_MAP } from "@/config/permission.config"
import { getPagesByCategory, deduplicatePermissions } from "@/lib/business/permission"
import { cn } from "@/lib/utils"

interface PagePermissionSelectorProps {
  selectedPages: string[]
  onPagesChange: (pages: string[]) => void
  onPermissionsChange: (permissions: React.SetStateAction<string[]>) => void
  disabled?: boolean
}

export function PagePermissionSelector({
  selectedPages,
  onPagesChange,
  onPermissionsChange,
  disabled,
}: PagePermissionSelectorProps) {
  const pagesByCategory = React.useMemo(() => {
    return getPagesByCategory()
  }, [])

  const handlePageToggle = (url: string, checked: boolean) => {
    if (disabled) return

    let nextPages: string[]
    if (checked) {
      nextPages = [...selectedPages, url]
      // Auto-enable resource permissions required by this page
      const requiredPermissions = PAGE_TO_RESOURCE_PERMISSION_MAP[url] || []
      if (requiredPermissions.length > 0) {
        onPermissionsChange((prev) => {
          return deduplicatePermissions([...prev, ...requiredPermissions])
        })
      }
    } else {
      nextPages = selectedPages.filter((x) => x !== url)
      // Note: We can optionally clean up permissions here, but usually it's safer
      // to let users explicitly manage/remove permissions in the Permissions tab
      // so we don't accidentally remove manually assigned resource permissions.
    }

    onPagesChange(nextPages)
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Page Permissions
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Select the pages this role has access to. Enabling a page automatically grants its required resource permissions.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {Object.entries(pagesByCategory).map(([category, pages]) => (
          <div key={category} className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {category}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pages.map((page) => {
                const isChecked = selectedPages.includes(page.url)

                return (
                  <label
                    key={page.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer select-none",
                      isChecked && "border-primary/50 bg-primary/5",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={disabled}
                      onChange={(e) => handlePageToggle(page.url, e.target.checked)}
                      className="rounded border-gray-300 focus:ring-primary h-4 w-4 text-primary mt-1"
                    />
                    <div className="space-y-0.5">
                      <span className="font-medium text-sm block">{page.label}</span>
                      <span className="text-xs text-muted-foreground block">{page.description}</span>
                      <span className="text-[10px] font-mono text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded mt-1.5 inline-block">
                        {page.url}
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
