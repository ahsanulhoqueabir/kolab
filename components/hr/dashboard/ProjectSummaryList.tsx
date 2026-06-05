import * as React from "react";
import { FolderKanban } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/core/ui/card";
import { Badge } from "@/components/core/ui/badge";
import type { ProjectSummary } from "@/services/dashboard.service";

interface ProjectSummaryListProps {
  projects: ProjectSummary[];
  isLoading?: boolean;
}

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  ACTIVE: "default",
  ON_HOLD: "outline",
  COMPLETED: "default",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
};

export function ProjectSummaryList({
  projects,
  isLoading,
}: ProjectSummaryListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Project Progress</h3>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-2 w-full bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No projects yet
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const progress =
                project.total_tasks > 0
                  ? Math.round(
                      (project.completed_tasks / project.total_tasks) * 100,
                    )
                  : 0;

              return (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">
                        {project.name}
                      </span>
                      <Badge
                        variant={STATUS_VARIANTS[project.status] || "secondary"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {STATUS_LABELS[project.status] || project.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {project.completed_tasks}/{project.total_tasks}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.max(progress, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
