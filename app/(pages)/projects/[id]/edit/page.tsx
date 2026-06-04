"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Card, CardHeader } from "@/components/core/ui/card";
import { Skeleton } from "@/components/core/ui/skeleton";
import { toast } from "sonner";
import { CreatePageHeader } from "@/components/core/shared/CreatePageHeader";
import { ProjectForm } from "@/components/hr/projects/ProjectForm";
import { useProjectStore } from "@/store/project.store";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { useReturnUrl } from "@/hooks/use-return-url";
import type { ProjectFormValues } from "@/components/hr/projects/ProjectForm";
import type { Project, ProjectStatus } from "@/types/db/project.types";

function EditProjectPageContent() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const { getProjectById, updateProject } = useProjectStore();
  const { returnTo } = useReturnUrl("/projects");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        const result = await getProjectById(projectId);

        if (result.success && result.data) {
          const project = result.data as unknown as Project;
          setValue("name", project.name);
          setValue("description", project.description || "");
          setValue(
            "deadline",
            project.deadline ? project.deadline.split("T")[0] : "",
          );
          setValue("status", (project.status || "DRAFT") as ProjectStatus);
        } else {
          toast.error(result.message || "Failed to load project");
          router.push(returnTo);
        }
      } catch {
        toast.error("Failed to load project");
        router.push(returnTo);
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId, getProjectById, setValue, router, returnTo]);

  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await updateProject(projectId, {
        name: data.name,
        description: data.description || undefined,
        deadline: data.deadline || undefined,
        status: data.status,
      });

      if (result.success) {
        toast.success("Project updated successfully");
        router.push(returnTo);
      } else {
        toast.error(result.message || "Failed to update project");
      }
    } catch {
      toast.error("Failed to update project");
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
            {[...Array(4)].map((_, i) => (
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
        resource="project"
        title="Edit Project"
        description="Update project details and status"
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

export default function EditProjectPage() {
  return (
    <PageAccessGuard pageUrl="/projects/[id]/edit">
      <ProtectedRoute>
        <EditProjectPageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
