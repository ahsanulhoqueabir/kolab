"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProjectForm } from "@/components/hr/projects/ProjectForm";
import { useProjectStore } from "@/store/project.store";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { CreateProjectParams } from "@/types/db/project.types";

function CreateProjectPageContent() {
  const router = useRouter();
  const { createProject } = useProjectStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateProject = async (data: CreateProjectParams) => {
    setIsSubmitting(true);
    try {
      const result = await createProject({
        name: data.name,
        description: data.description,
        deadline: data.deadline,
        status: data.status,
      });

      if (result.success) {
        toast.success("Project created successfully");
        router.push("/projects");
      } else {
        toast.error(result.message || "Failed to create project");
      }
    } catch {
      toast.error("Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProjectForm
      mode="create"
      isSubmitting={isSubmitting}
      onSubmit={handleCreateProject}
    />
  );
}

export default function CreateProjectPage() {
  return (
    <PageAccessGuard pageUrl="/projects/create">
      <ProtectedRoute>
        <CreateProjectPageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
