"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FileText,
  Calendar,
  User,
  FolderKanban,
  Edit,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/core/ui/card";
import { Skeleton } from "@/components/core/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDateInTimezone } from "@/lib/date.utils";
import { useTaskStore } from "@/store/task.store";
import { TaskStatusBadge } from "@/components/hr/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/hr/tasks/TaskPriorityBadge";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { ConfirmationDialog } from "@/components/core/shared/ConfirmationDialog";
import { useReturnUrl } from "@/hooks/use-return-url";
import type { Task } from "@/types/db/task.types";

function TaskDetailsPageContent() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  const { returnTo } = useReturnUrl("/tasks");

  const { getTaskById, deleteTask } = useTaskStore();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    const loadTask = async () => {
      try {
        setIsLoading(true);
        const result = await getTaskById(taskId);
        if (result.success && result.data) {
          setTask(result.data as unknown as Task);
        } else {
          toast.error(result.message || "Task not found");
          router.push(returnTo);
        }
      } catch {
        toast.error("Failed to load task");
        router.push(returnTo);
      } finally {
        setIsLoading(false);
      }
    };

    loadTask();
  }, [taskId, getTaskById, router, returnTo]);

  const handleDelete = async () => {
    try {
      const result = await deleteTask(taskId);
      if (result.success) {
        toast.success("Task deleted successfully");
        router.push(returnTo);
      } else {
        toast.error(result.message || "Failed to delete task");
      }
    } catch {
      toast.error("Failed to delete task");
    }
    setIsConfirmOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Task not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(returnTo)}
        >
          Back to Tasks
        </Button>
      </div>
    );
  }

  const projectName =
    typeof task.project === "object" && task.project !== null
      ? (task.project as { name: string }).name
      : "Unknown";

  const assigneeName =
    typeof task.assigned_to === "object" && task.assigned_to !== null
      ? (task.assigned_to as { name: string }).name
      : null;

  const creatorName =
    typeof task.created_by === "object" && task.created_by !== null
      ? (task.created_by as { name: string }).name
      : "Unknown";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push(returnTo)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold">{task.title}</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Created by {creatorName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/tasks/${taskId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Task Info */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Task Details</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Description
              </h3>
              <p className="text-sm whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Status
              </h3>
              <TaskStatusBadge status={task.status} />
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Priority
              </h3>
              <TaskPriorityBadge priority={task.priority} />
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Project
              </h3>
              <div className="flex items-center gap-1 text-sm">
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                {projectName}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Assignee
              </h3>
              <div className="flex items-center gap-1 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                {assigneeName || "Unassigned"}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Due Date
              </h3>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {task.due_date
                  ? formatDateInTimezone(task.due_date)
                  : "No due date"}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Created
              </h3>
              <p className="text-sm">
                {task.created_at ? formatDateInTimezone(task.created_at) : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Delete Task"
        subtitle={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}

export default function TaskDetailsPage() {
  return (
    <PageAccessGuard pageUrl="/tasks/[id]">
      <ProtectedRoute>
        <TaskDetailsPageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
