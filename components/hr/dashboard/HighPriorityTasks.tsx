import * as React from "react";
import { AlertTriangle, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/core/ui/card";
import { Badge } from "@/components/core/ui/badge";
import { TaskStatusBadge } from "@/components/hr/tasks/TaskStatusBadge";
import type { HighPriorityTask } from "@/services/dashboard.service";
import { formatDateInTimezone } from "@/lib/date.utils";
import { TaskStatus } from "@/types/db/task.types";

interface HighPriorityTasksProps {
  tasks: HighPriorityTask[];
  isLoading?: boolean;
}

export function HighPriorityTasks({
  tasks,
  isLoading,
}: HighPriorityTasksProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h3 className="text-lg font-semibold">High Priority Tasks</h3>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No high priority tasks
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2 rounded-lg border border-red-100 dark:border-red-900/20"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {task.project_name}
                    </Badge>
                    <TaskStatusBadge status={task.status as TaskStatus} />
                    {task.assigned_to_name && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {task.assigned_to_name}
                      </div>
                    )}
                  </div>
                </div>
                {task.due_date && (
                  <div className="text-xs text-muted-foreground shrink-0 ml-3">
                    Due {formatDateInTimezone(task.due_date)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
