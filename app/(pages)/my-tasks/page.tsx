"use client";

import { useEffect, useState } from "react";
import { FileText, Calendar, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/core/ui/badge";
import { useTaskStore } from "@/store/task.store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { TaskStatusBadge } from "@/components/hr/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/hr/tasks/TaskPriorityBadge";
import { useReturnUrl } from "@/hooks/use-return-url";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";
import type { TaskListItem, TaskStatus } from "@/types/db/task.types";

function MyTasksPageContent() {
  const router = useRouter();
  const { withReturnUrl } = useReturnUrl("/my-tasks");

  const tasks = useTaskStore((state) => state.tasks);
  const loading = useTaskStore((state) => state.isLoading);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const updateTaskStatus = useTaskStore((state) => state.updateTaskStatus);

  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    // Fetch tasks assigned to current user — the API handles this via auth
    fetchTasks({ deadlineStatus: undefined });
  }, [fetchTasks]);

  // Filter tasks by status locally
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    return true;
  });

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const result = await updateTaskStatus(taskId, newStatus);
      if (result.success) {
        toast.success(`Task status updated to ${newStatus.replace("_", " ")}`);
      } else {
        toast.error(result.message || "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const getProjectName = (task: TaskListItem): string => {
    return typeof task.project === "object" && task.project !== null
      ? (task.project as { name: string }).name
      : "Unknown";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-sm text-muted-foreground">Tasks assigned to you</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading tasks...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            {statusFilter
              ? "No tasks match the selected filter"
              : "No tasks assigned to you yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className="flex items-center gap-2 cursor-pointer hover:text-primary"
                  onClick={() =>
                    router.push(withReturnUrl(`/tasks/${task.id}`))
                  }
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">{task.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <TaskStatusBadge status={task.status} />
                  <TaskPriorityBadge priority={task.priority} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {getProjectName(task)}
                </Badge>
                {task.due_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(task.due_date).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Quick status update */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  Quick status:
                </span>
                <div className="w-32">
                  <Select
                    value={task.status}
                    onValueChange={(val) =>
                      handleStatusChange(String(task.id), val as TaskStatus)
                    }
                  >
                    <SelectTrigger className="h-7 text-xs px-2 py-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyTasksPage() {
  return (
    <PageAccessGuard pageUrl="/my-tasks">
      <ProtectedRoute>
        <MyTasksPageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
