import * as React from "react";
import { Clock, Plus, Pencil, Trash2, User } from "lucide-react";
import { Badge } from "@/components/core/ui/badge";
import type { LogAction } from "@/types/db/logs.types";
import { formatDateInTimezone } from "@/lib/date.utils";

interface ActivityLogItemProps {
  log: {
    id: string;
    description: string;
    action: LogAction;
    table: string;
    actor?: { id: string; name: string } | string | null;
    created_at: string;
  };
}

const ACTION_ICONS: Record<LogAction, React.ElementType> = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
};

const ACTION_VARIANTS: Record<
  LogAction,
  "default" | "secondary" | "destructive"
> = {
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
};

const TABLE_LABELS: Record<string, string> = {
  project: "Project",
  task: "Task",
  team: "Team",
  profile: "User",
  role: "Role",
};

export function ActivityLogItem({ log }: ActivityLogItemProps) {
  const Icon = ACTION_ICONS[log.action];
  const actorName =
    typeof log.actor === "object" && log.actor !== null
      ? (log.actor as { name: string }).name
      : "System";

  const tableLabel = TABLE_LABELS[log.table] || log.table;

  const timeAgo = getTimeAgo(new Date(log.created_at));

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{log.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant={ACTION_VARIANTS[log.action]}
            className="text-[10px] px-1.5 py-0"
          >
            {log.action}
          </Badge>
          <span className="text-xs text-muted-foreground capitalize">
            {tableLabel}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            {actorName}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateInTimezone(date.toISOString());
}
