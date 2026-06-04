"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { ActivityLogList } from "@/components/hr/logs/ActivityLogList";
import { api_client } from "@/lib/api/api-client";
import type { LogListItem } from "@/types/db/logs.types";

function ActivityLogPageContent() {
  const [logs, setLogs] = useState<LogListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;

  const fetchLogs = useCallback(async (pageNum: number, append = false) => {
    try {
      setIsLoading(true);
      const offset = (pageNum - 1) * pageSize;
      const res = await api_client.get(
        `/logs?limit=${pageSize}&offset=${offset}`,
      );
      const data = res.data?.data || [];

      if (append) {
        setLogs((prev) => [...prev, ...data]);
      } else {
        setLogs(data);
      }

      setHasMore(data.length === pageSize);
    } catch {
      toast.error("Failed to load activities");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleRefresh = async () => {
    await fetchLogs(1);
    toast.success("Activities refreshed");
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLogs(nextPage, true);
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
