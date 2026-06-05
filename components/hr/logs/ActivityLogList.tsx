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
  maxItems,
}: ActivityLogListProps) {
  const displayLogs = maxItems ? logs.slice(0, maxItems) : logs;

  return (
    <div className="p-0">
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
    </div>
  );
}
