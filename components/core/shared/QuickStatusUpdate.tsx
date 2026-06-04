"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TaskStatusValue = "TODO" | "IN_PROGRESS" | "COMPLETED";

interface QuickStatusUpdateProps {
  value: TaskStatusValue;
  onChange: (newStatus: TaskStatusValue) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const STATUS_OPTIONS: { value: TaskStatusValue; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

const STATUS_COLORS: Record<TaskStatusValue, string> = {
  TODO: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
  IN_PROGRESS:
    "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  COMPLETED:
    "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
};

/**
 * Inline status update dropdown for tasks.
 * Useful for drag-drop or checkbox style status changes.
 *
 * @example
 * ```tsx
 * <QuickStatusUpdate
 *   value={task.status}
 *   onChange={(newStatus) => updateTaskStatus(task.id, newStatus)}
 *   size="sm"
 * />
 * ```
 */
export function QuickStatusUpdate({
  value,
  onChange,
  disabled,
  size = "md",
  className,
}: QuickStatusUpdateProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TaskStatusValue)}
      disabled={disabled}
      className={cn(
        "rounded-md border font-medium transition-colors cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        STATUS_COLORS[value],
        size === "sm" ? "text-xs px-1.5 py-0.5 h-7" : "text-sm px-2 py-1 h-8",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
