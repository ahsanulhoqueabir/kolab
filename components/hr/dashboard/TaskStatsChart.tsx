import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/core/ui/card";
import { Badge } from "@/components/core/ui/badge";
import type { TaskStats } from "@/services/dashboard.service";

interface TaskStatsChartProps {
  stats: TaskStats | null;
  isLoading?: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-blue-500",
  LOW: "bg-gray-400",
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-gray-400",
  IN_PROGRESS: "bg-blue-500",
  COMPLETED: "bg-green-500",
};

const PRIORITY_LABELS: Record<string, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

function SimpleBarChart({
  data,
  colorMap,
  labelMap,
}: {
  data: { priority?: string; status?: string; count: number }[];
  colorMap: Record<string, string>;
  labelMap: Record<string, string>;
}) {
  const maxValue = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const key = item.priority || item.status || "";
        const label = labelMap[key] || key;
        const percentage = (item.count / maxValue) * 100;

        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{label}</span>
              <span className="font-medium">{item.count}</span>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${colorMap[key] || "bg-primary"}`}
                style={{ width: `${Math.max(percentage, 4)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TaskStatsChart({ stats, isLoading }: TaskStatsChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              <div className="h-2.5 w-full bg-muted rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold">Tasks by Priority</h3>
        </CardHeader>
        <CardContent>
          <SimpleBarChart
            data={stats.by_priority}
            colorMap={PRIORITY_COLORS}
            labelMap={PRIORITY_LABELS}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold">Tasks by Status</h3>
        </CardHeader>
        <CardContent>
          <SimpleBarChart
            data={stats.by_status}
            colorMap={STATUS_COLORS}
            labelMap={STATUS_LABELS}
          />
        </CardContent>
      </Card>
    </div>
  );
}
