import * as React from "react";
import {
  FolderKanban,
  ListChecks,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/core/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardKPIs } from "@/services/dashboard.service";

interface KpiCardsProps {
  kpis: DashboardKPIs | null;
  isLoading?: boolean;
}

interface KpiCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  description?: string;
  className?: string;
}

function KpiCard({
  title,
  value,
  icon: Icon,
  description,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl md:text-3xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KpiCards({ kpis, isLoading }: KpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-2 animate-pulse">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-8 w-12 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <KpiCard
        title="Total Projects"
        value={kpis.total_projects}
        icon={FolderKanban}
      />
      <KpiCard title="Total Tasks" value={kpis.total_tasks} icon={ListChecks} />
      <KpiCard
        title="Completed"
        value={kpis.completed_tasks}
        icon={CheckCircle2}
        className="text-green-600"
      />
      <KpiCard
        title="Pending"
        value={kpis.pending_tasks}
        icon={Clock}
        className="text-amber-600"
      />
      <KpiCard
        title="Overdue"
        value={kpis.overdue_tasks}
        icon={AlertTriangle}
        className={kpis.overdue_tasks > 0 ? "text-red-600" : ""}
        description={
          kpis.overdue_tasks > 0 ? "Requires attention" : "All on track"
        }
      />
    </div>
  );
}
