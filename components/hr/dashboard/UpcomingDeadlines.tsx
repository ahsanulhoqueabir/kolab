import { Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/core/ui/card";
import { Badge } from "@/components/core/ui/badge";
import { TaskPriorityBadge } from "@/components/hr/tasks/TaskPriorityBadge";
import type { UpcomingDeadline } from "@/services/dashboard.service";
import { TaskPriority } from "@/types/db/task.types";
import { formatDateInTimezone } from "@/lib/date.utils";

interface UpcomingDeadlinesProps {
  deadlines: UpcomingDeadline[];
  isLoading?: boolean;
}

export function UpcomingDeadlines({
  deadlines,
  isLoading,
}: UpcomingDeadlinesProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Upcoming Deadlines</h3>
          <Badge variant="secondary" className="ml-auto text-xs">
            Next 7 days
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : deadlines.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No upcoming deadlines
          </div>
        ) : (
          <div className="space-y-3">
            {deadlines.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2 rounded-lg border"
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
                    <TaskPriorityBadge
                      priority={task.priority as TaskPriority}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-3">
                  <Clock className="h-3 w-3" />
                  {formatDateInTimezone(task.due_date)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
