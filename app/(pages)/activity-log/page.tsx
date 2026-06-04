"use client";

import { useEffect } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { ActivityLogList } from "@/components/hr/logs/ActivityLogList";
import { useLogStore } from "@/store/log.store";

function ActivityLogPageContent() {
  const { logs, isLoading, hasMore, page, fetchLogs, appendLogs } =
    useLogStore();

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleRefresh = async () => {
    await fetchLogs(1);
    toast.success("Activities refreshed");
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    appendLogs(nextPage);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Activity Log
          </h1>
          <p className="text-sm text-muted-foreground">
            Track all system activities and changes
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

      <ActivityLogList
        logs={logs}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        title="All Activities"
      />

      {/* Load more */}
      {hasMore && !isLoading && (
        <div className="text-center">
          <Button variant="outline" onClick={handleLoadMore}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ActivityLogPage() {
  return (
    <PageAccessGuard pageUrl="/activity-log">
      <ProtectedRoute>
        <ActivityLogPageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
