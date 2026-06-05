import * as React from "react";
import { FileText, Edit, Trash2, Calendar, User } from "lucide-react";
import { Badge } from "@/components/core/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import type { TaskPriority, TaskStatus } from "@/types/db/task.types";
import { formatDateInTimezone } from "@/lib/date.utils";

interface TaskListCardProps {
  task: {
    id: string | number;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string | null;
    project: { id: string; name: string } | string;
    assigned_to?: { id: string; name: string } | string | null;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskListCard({ task, onEdit, onDelete }: TaskListCardProps) {
  const projectName =
    typeof task.project === "object" && task.project !== null
      ? (task.project as { name: string }).name
      : "Unknown";

  const assigneeName =
    typeof task.assigned_to === "object" && task.assigned_to !== null
      ? (task.assigned_to as { name: string }).name
      : null;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-semibold">{task.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
        <TaskStatusBadge status={task.status} />
        <TaskPriorityBadge priority={task.priority} />
        <Badge variant="outline" className="text-xs">
          {projectName}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {task.due_date && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDateInTimezone(task.due_date)}
          </div>
        )}
        {assigneeName && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {assigneeName}
          </div>
        )}
      </div>
    </div>
  );
}
