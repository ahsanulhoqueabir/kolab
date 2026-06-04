"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import type { TaskPriority, TaskStatus } from "@/types/db/task.types";

function CreateTaskPageContent() {
  const router = useRouter();
  const { createTask } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const { users, fetchUsers } = useUserStore();
  const { returnTo } = useReturnUrl("/tasks");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const onSubmit = async (data: TaskFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createTask({
        title: data.title,
        description: data.description || undefined,
        assigned_to: data.assigned_to || undefined,
        due_date: data.due_date || undefined,
        priority: data.priority,
        status: data.status,
        project: data.project,
      });

      if (result.success) {
        toast.success("Task created successfully");
        router.push(returnTo);
      } else {
        toast.error(result.message || "Failed to create task");
      }
    } catch {
      toast.error("Failed to create task");
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

  return (
    <div className="">
      <CreatePageHeader
        resource="task"
        title="Create Task"
        description="Create a new task under a project"
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

export default function CreateTaskPage() {
  return (
    <PageAccessGuard pageUrl="/tasks/create">
      <ProtectedRoute>
        <CreateTaskPageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
