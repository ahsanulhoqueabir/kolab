"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Card, CardHeader } from "@/components/core/ui/card";
import { Skeleton } from "@/components/core/ui/skeleton";
import { toast } from "sonner";
import { CreatePageHeader } from "@/components/core/shared/CreatePageHeader";
import { TaskForm } from "@/components/hr/tasks/TaskForm";
import { useTaskStore } from "@/store/task.store";
import { useProjectStore } from "@/store/project.store";
import { useUserStore } from "@/store/user.store";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { useReturnUrl } from "@/hooks/use-return-url";
import type { TaskFormValues } from "@/components/hr/tasks/TaskForm";
import type { Task, TaskPriority, TaskStatus } from "@/types/db/task.types";

function EditTaskPageContent() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const { getTaskById, updateTask } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const { users, fetchUsers } = useUserStore();
  const { returnTo } = useReturnUrl("/tasks");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: "",
      description: "",
      project: "",
      assigned_to: "",
      due_date: "",
      priority: "MEDIUM" as TaskPriority,
      status: "TODO" as TaskStatus,
    },
  });

  const formTitle = watch("title");
  const selectedProject = watch("project");
  const canSubmit = !!(formTitle && selectedProject);

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
          setValue("title", task.title);
          setValue("description", task.description || "");

          const projectId =
            typeof task.project === "object" && task.project !== null
              ? (task.project as { id: string }).id
              : (task.project as string);
          setValue("project", projectId);

          const assigneeId =
            typeof task.assigned_to === "object" && task.assigned_to !== null
              ? (task.assigned_to as { id: string }).id
              : "";
          setValue("assigned_to", assigneeId);

          setValue(
            "due_date",
            task.due_date ? task.due_date.split("T")[0] : "",
          );
          setValue("priority", task.priority);
          setValue("status", task.status);
        } else {
          toast.error(result.message || "Failed to load task");
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
  }, [taskId, getTaskById, setValue, router, returnTo]);

  const onSubmit = async (data: TaskFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await updateTask(taskId, {
        title: data.title,
        description: data.description || undefined,
        assigned_to: data.assigned_to || null,
        due_date: data.due_date || null,
        priority: data.priority,
        status: data.status,
        project: data.project,
      });

      if (result.success) {
        toast.success("Task updated successfully");
        router.push(returnTo);
      } else {
        toast.error(result.message || "Failed to update task");
      }
    } catch {
      toast.error("Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => router.push(returnTo);

  const handleSaveAndReturn = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(onSubmit)();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(onSubmit)();
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
    <div className="">
      <CreatePageHeader
        resource="task"
        title="Edit Task"
        description="Update task details, assignment, and status"
        onDiscard={handleDiscard}
        onSaveAndReturn={handleSaveAndReturn}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        disabled={!canSubmit}
      />

      <form
        id="task-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 mb-10"
      >
        <TaskForm
          register={register}
          errors={errors}
          setValue={setValue}
          watch={watch}
          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          users={users.map((u) => ({ id: u.id, name: u.name }))}
          isSubmitting={isSubmitting}
          showStatus
        />
      </form>
    </div>
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
