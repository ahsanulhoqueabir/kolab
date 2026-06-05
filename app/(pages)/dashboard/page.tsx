"use client";

import { useEffect } from "react";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { useDashboardStore } from "@/store/dashboard.store";
import { KpiCards } from "@/components/hr/dashboard/KpiCards";
import { TaskStatsChart } from "@/components/hr/dashboard/TaskStatsChart";
import { RecentActivities } from "@/components/hr/dashboard/RecentActivities";
import { UpcomingDeadlines } from "@/components/hr/dashboard/UpcomingDeadlines";
import { HighPriorityTasks } from "@/components/hr/dashboard/HighPriorityTasks";
import { ProjectSummaryList } from "@/components/hr/dashboard/ProjectSummaryList";
import { WorkloadSummary } from "@/components/hr/dashboard/WorkloadSummary";

function DashboardPageContent() {
  const kpis = useDashboardStore((state) => state.kpis);
  const taskStats = useDashboardStore((state) => state.taskStats);
  const upcomingDeadlines = useDashboardStore(
    (state) => state.upcomingDeadlines,
  );
  const highPriorityTasks = useDashboardStore(
    (state) => state.highPriorityTasks,
  );
  const projectSummaries = useDashboardStore((state) => state.projectSummaries);
  const recentActivitiesCount = useDashboardStore(
    (state) => state.recentActivitiesCount,
  );
  const isLoading = useDashboardStore((state) => state.isLoading);
  const fetchDashboard = useDashboardStore((state) => state.fetchDashboard);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = async () => {
    await fetchDashboard();
    toast.success("Dashboard refreshed");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of your projects, tasks, and team activity
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <KpiCards kpis={kpis} isLoading={isLoading} />

      {/* Charts Row */}
      <TaskStatsChart stats={taskStats} isLoading={isLoading} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingDeadlines
          deadlines={upcomingDeadlines}
          isLoading={isLoading}
        />
        <HighPriorityTasks tasks={highPriorityTasks} isLoading={isLoading} />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProjectSummaryList
            projects={projectSummaries}
            isLoading={isLoading}
          />
        </div>
        <div className="space-y-6">
          <RecentActivities
            count={recentActivitiesCount}
            isLoading={isLoading}
          />
          <WorkloadSummary isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <PageAccessGuard pageUrl="/dashboard">
      <ProtectedRoute>
        <DashboardPageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
