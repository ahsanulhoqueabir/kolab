import * as React from "react";
import { Activity, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/core/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityLogItem } from "./ActivityLogItem";
import type { LogListItem } from "@/types/db/logs.types";

interface ActivityLogListProps {
  logs: LogListItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  maxItems?: number;
  title?: string;
}

export function ActivityLogList({
  logs,
  isLoading,
  onRefresh,
  maxItems,
  title = "Recent Activities",
}: ActivityLogListProps) {
  const displayLogs = maxItems ? logs.slice(0, maxItems) : logs;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground text-center">
            Loading activities...
          </div>
        ) : displayLogs.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center">
            No activities recorded yet
          </div>
        ) : (
          <div className="px-4">
            {displayLogs.map((log) => (
              <ActivityLogItem key={log.id} log={log} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
