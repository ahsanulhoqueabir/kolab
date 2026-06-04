"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BulkAction {
  label: string;
  icon?: React.ElementType;
  variant?: "default" | "destructive" | "outline" | "secondary";
  onClick: (selectedIds: string[]) => void;
  confirmMessage?: string;
  requireSelection?: boolean;
}

interface BulkActionsProps {
  selectedIds: string[];
  actions: BulkAction[];
  onClear: () => void;
  position?: "top" | "bottom";
  className?: string;
}

/**
 * Bulk action bar for selecting and performing actions on multiple items.
 *
 * @example
 * ```tsx
 * <BulkActions
 *   selectedIds={selectedIds}
 *   actions={[
 *     {
 *       label: "Delete",
 *       icon: Trash2,
 *       variant: "destructive",
 *       onClick: (ids) => handleBulkDelete(ids),
 *       confirmMessage: "Are you sure?",
 *     },
 *   ]}
 *   onClear={() => setSelectedIds([])}
 * />
 * ```
 */
export function BulkActions({
  selectedIds,
  actions,
  onClear,
  position = "bottom",
  className,
}: BulkActionsProps) {
  if (selectedIds.length === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md border bg-muted/40 p-3 text-sm animate-in",
        position === "bottom"
          ? "slide-in-from-bottom-2"
          : "slide-in-from-top-2",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium">
          {selectedIds.length} item{selectedIds.length !== 1 ? "s" : ""}{" "}
          selected
        </span>
        <Button variant="ghost" size="xs" onClick={onClear}>
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {actions.map((act, idx) => {
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
                    onClear();
                  }
                } else {
                  act.onClick(selectedIds);
                  onClear();
                }
              }}
            >
              {Icon && <Icon className="h-3.5 w-3.5 mr-1" />}
              {act.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
