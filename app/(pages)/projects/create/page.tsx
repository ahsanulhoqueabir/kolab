"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CreatePageHeader } from "@/components/core/shared/CreatePageHeader";
import { ProjectForm } from "@/components/hr/projects/ProjectForm";
import { useProjectStore } from "@/store/project.store";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { useReturnUrl } from "@/hooks/use-return-url";
import type { ProjectFormValues } from "@/components/hr/projects/ProjectForm";
import type { ProjectStatus } from "@/types/db/project.types";

function CreateProjectPageContent() {
  const router = useRouter();
  const { createProject } = useProjectStore();
  const { returnTo } = useReturnUrl("/projects");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    defaultValues: {
      name: "",
      description: "",
      deadline: "",
      status: "DRAFT" as ProjectStatus,
    },
  });

  const formName = watch("name");
  const canSubmit = !!formName;

  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createProject({
        name: data.name,
        description: data.description || undefined,
        deadline: data.deadline || undefined,
        status: data.status,
      });

      if (result.success) {
        toast.success("Project created successfully");
        router.push(returnTo);
      } else {
        toast.error(result.message || "Failed to create project");
      }
    } catch {
      toast.error("Failed to create project");
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
        resource="project"
        title="Create Project"
        description="Create a new project to organize your tasks"
        onDiscard={handleDiscard}
        onSaveAndReturn={handleSaveAndReturn}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        disabled={!canSubmit}
      />

      <form
        id="project-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 mb-10"
      >
        <ProjectForm
          register={register}
          errors={errors}
          setValue={setValue}
          watch={watch}
          isSubmitting={isSubmitting}
        />
      </form>
    </div>
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
