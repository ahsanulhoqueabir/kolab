import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/core/ui/card";
import { Badge } from "@/components/core/ui/badge";
import type { WorkloadItem } from "@/types/db/team.types";

interface WorkloadSummaryProps {
  workload: WorkloadItem[];
  isLoading?: boolean;
}

export function WorkloadSummary({ workload, isLoading }: WorkloadSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Member Workload</h3>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Loading workload...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (workload.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Member Workload</h3>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            No workload data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Member Workload</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workload.map((item) => (
            <div key={item.profile_id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.profile_name}</span>
                <span className="text-xs text-muted-foreground">
                  {item.total_tasks} tasks
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width:
                      item.total_tasks > 0
                        ? `${(item.completed_tasks / item.total_tasks) * 100}%`
                        : "0%",
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="default" className="text-[10px] px-1.5 py-0">
                  {item.completed_tasks} done
                </Badge>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {item.pending_tasks} pending
                </Badge>
                {item.overdue_tasks > 0 && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {item.overdue_tasks} overdue
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
