"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TaskForm } from "@/components/hr/tasks/TaskForm";
import { useTaskStore } from "@/store/task.store";
import { useProjectStore } from "@/store/project.store";
import { useUserStore } from "@/store/user.store";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { CreateTaskParams } from "@/types/db/task.types";

function CreateTaskPageContent() {
  const router = useRouter();
  const { createTask } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const { users, fetchUsers } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, [fetchProjects, fetchUsers]);

  const handleCreateTask = async (data: CreateTaskParams) => {
    setIsSubmitting(true);
    try {
      const result = await createTask({
        title: data.title,
        description: data.description,
        assigned_to: data.assigned_to,
        due_date: data.due_date,
        priority: data.priority,
        status: data.status,
        project: data.project,
      });

      if (result.success) {
        toast.success("Task created successfully");
        router.push("/tasks");
      } else {
        toast.error(result.message || "Failed to create task");
      }
    } catch {
      toast.error("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TaskForm
      mode="create"
      isSubmitting={isSubmitting}
      onSubmit={handleCreateTask}
      projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      users={users.map((u) => ({ id: u.id, name: u.name }))}
    />
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
