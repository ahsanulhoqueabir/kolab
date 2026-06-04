"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader } from "@/components/core/ui/card";
import { Skeleton } from "@/components/core/ui/skeleton";
import { toast } from "sonner";
import { ProjectForm } from "@/components/hr/projects/ProjectForm";
import { useProjectStore } from "@/store/project.store";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import type { CreateProjectParams, Project } from "@/types/db/project.types";

function EditProjectPageContent() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const { getProjectById, updateProject } = useProjectStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<
    CreateProjectParams | undefined
  >(undefined);

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        const result = await getProjectById(projectId);

        if (result.success && result.data) {
          const project = result.data as unknown as Project;
          setInitialData({
            name: project.name,
            description: project.description || "",
            deadline: project.deadline ? project.deadline.split("T")[0] : "",
            status: project.status || "DRAFT",
          });
        } else {
          toast.error(result.message || "Failed to load project");
          router.push("/projects");
        }
      } catch {
        toast.error("Failed to load project");
        router.push("/projects");
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [getProjectById, projectId, router]);

  const handleUpdateProject = async (data: CreateProjectParams) => {
    setIsSubmitting(true);
    try {
      const result = await updateProject(projectId, {
        name: data.name,
        description: data.description,
        deadline: data.deadline,
        status: data.status,
      });

      if (result.success) {
        toast.success("Project updated successfully");
        router.push("/projects");
      } else {
        toast.error(result.message || "Failed to update project");
      }
    } catch {
      toast.error("Failed to update project");
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
    <ProjectForm
      mode="edit"
      initialData={initialData}
      isSubmitting={isSubmitting}
      onSubmit={handleUpdateProject}
    />
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
