"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/core/ui/card";
import { Badge } from "@/components/core/ui/badge";
import { useTeamStore } from "@/store/team.store";

interface WorkloadSummaryProps {
  isLoading?: boolean;
}

export function WorkloadSummary({ isLoading }: WorkloadSummaryProps) {
  const workload = useTeamStore((state) => state.workload);
  const fetchWorkload = useTeamStore((state) => state.fetchWorkload);

  useEffect(() => {
    fetchWorkload();
  }, [fetchWorkload]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-5 w-36 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-2 w-full bg-muted rounded animate-pulse" />
            </div>
          ))}
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
          <div className="text-sm text-muted-foreground text-center py-4">
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
          {workload.map((item) => {
            const progress =
              item.total_tasks > 0
                ? Math.round((item.completed_tasks / item.total_tasks) * 100)
                : 0;

            return (
              <div key={item.profile_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {item.profile_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.total_tasks} tasks
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.max(progress, 2)}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">
                    {item.completed_tasks} done
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
