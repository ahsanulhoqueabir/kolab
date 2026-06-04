"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader } from "@/components/core/ui/card";
import { Skeleton } from "@/components/core/ui/skeleton";
import { toast } from "sonner";
import { TaskForm } from "@/components/hr/tasks/TaskForm";
import { useTaskStore } from "@/store/task.store";
import { useProjectStore } from "@/store/project.store";
import { useUserStore } from "@/store/user.store";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import type { CreateTaskParams, Task } from "@/types/db/task.types";

function EditTaskPageContent() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const { getTaskById, updateTask } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const { users, fetchUsers } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<CreateTaskParams | undefined>(
    undefined,
  );

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, [fetchProjects, fetchUsers]);

  // Load task data
  useEffect(() => {
    const loadTask = async () => {
      try {
        setIsLoading(true);
        const result = await getTaskById(taskId);

        if (result.success && result.data) {
          const task = result.data as unknown as Task;
          const projectId =
            typeof task.project === "object" && task.project !== null
              ? (task.project as { id: string }).id
              : (task.project as string);
          const assigneeId =
            typeof task.assigned_to === "object" && task.assigned_to !== null
              ? (task.assigned_to as { id: string }).id
              : "";

          setInitialData({
            title: task.title,
            description: task.description || "",
            project: projectId,
            assigned_to: assigneeId,
            due_date: task.due_date ? task.due_date.split("T")[0] : "",
            priority: task.priority,
            status: task.status,
          });
        } else {
          toast.error(result.message || "Failed to load task");
          router.push("/tasks");
        }
      } catch {
        toast.error("Failed to load task");
        router.push("/tasks");
      } finally {
        setIsLoading(false);
      }
    };

    loadTask();
  }, [getTaskById, router, taskId]);

  const handleUpdateTask = async (data: CreateTaskParams) => {
    setIsSubmitting(true);
    try {
      const result = await updateTask(taskId, {
        title: data.title,
        description: data.description,
        assigned_to: data.assigned_to || null,
        due_date: data.due_date || null,
        priority: data.priority,
        status: data.status,
        project: data.project,
      });

      if (result.success) {
        toast.success("Task updated successfully");
        router.push("/tasks");
      } else {
        toast.error(result.message || "Failed to update task");
      }
    } catch {
      toast.error("Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="">
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:justify-between md:items-start">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <div className="p-6 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <TaskForm
      mode="edit"
      initialData={initialData}
      isSubmitting={isSubmitting}
      onSubmit={handleUpdateTask}
      projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      users={users.map((u) => ({ id: u.id, name: u.name }))}
    />
  );
}

export default function EditTaskPage() {
  return (
    <PageAccessGuard pageUrl="/tasks/[id]/edit">
      <ProtectedRoute>
        <EditTaskPageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
