import { Badge } from "@/components/core/ui/badge";
import type { TaskStatus } from "@/types/db/task.types";

const STATUS_VARIANTS: Record<
  TaskStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  TODO: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
  );
}
