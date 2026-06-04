import * as React from "react";
import { FolderKanban, Edit, Trash2, Calendar } from "lucide-react";
import { Badge } from "@/components/core/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProjectStatus } from "@/types/db/project.types";

interface ProjectListCardProps {
  project: {
    id: string | number;
    name: string;
    status: ProjectStatus;
    deadline?: string | null;
    task_count?: number;
    created_by?: { id: string; name: string } | string | null;
  };
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_VARIANTS: Record<
  ProjectStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  ACTIVE: "default",
  ON_HOLD: "outline",
  COMPLETED: "default",
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
};

export function ProjectListCard({
  project,
  onEdit,
  onDelete,
}: ProjectListCardProps) {
  const creatorName =
    typeof project.created_by === "object" && project.created_by !== null
      ? (project.created_by as { name: string }).name
      : "Unknown";

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{project.name}</span>
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
        <Badge variant={STATUS_VARIANTS[project.status]}>
          {STATUS_LABELS[project.status]}
        </Badge>
        {project.deadline && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(project.deadline).toLocaleDateString()}
          </div>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {project.task_count ?? 0} tasks
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        Created by: {creatorName}
      </div>
    </div>
  );
}
