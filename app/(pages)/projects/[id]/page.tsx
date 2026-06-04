"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FolderKanban, Calendar, Edit, Trash2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/core/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/core/ui/card";
import { Skeleton } from "@/components/core/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useProjectStore } from "@/store/project.store";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { ConfirmationDialog } from "@/components/core/shared/ConfirmationDialog";
import { useReturnUrl } from "@/hooks/use-return-url";
import type { Project, ProjectStatus } from "@/types/db/project.types";

const STATUS_VARIANTS: Record<
  ProjectStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  ACTIVE: "default",
  ON_HOLD: "outline",
  COMPLETED: "default",
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
};

function ProjectDetailsPageContent() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { returnTo } = useReturnUrl("/projects");

  const { getProjectById, deleteProject } = useProjectStore();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        const result = await getProjectById(projectId);
        if (result.success && result.data) {
          setProject(result.data as unknown as Project);
        } else {
          toast.error(result.message || "Project not found");
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
  }, [projectId, getProjectById, router, returnTo]);

  const handleDelete = async () => {
    try {
      const result = await deleteProject(projectId);
      if (result.success) {
        toast.success("Project deleted successfully");
        router.push(returnTo);
      } else {
        toast.error(result.message || "Failed to delete project");
      }
    } catch {
      toast.error("Failed to delete project");
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

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(returnTo)}
        >
          Back to Projects
        </Button>
      </div>
    );
  }

  const creatorName =
    typeof project.created_by === "object" && project.created_by !== null
      ? (project.created_by as { name: string }).name
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
              <FolderKanban className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold">{project.name}</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Created by {creatorName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANTS[project.status as ProjectStatus]}>
            {STATUS_LABELS[project.status as ProjectStatus]}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/edit`)}
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

      {/* Project Info */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Project Details</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Description
              </h3>
              <p className="text-sm whitespace-pre-wrap">
                {project.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Status
              </h3>
              <Badge variant={STATUS_VARIANTS[project.status as ProjectStatus]}>
                {STATUS_LABELS[project.status as ProjectStatus]}
              </Badge>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Deadline
              </h3>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {project.deadline
                  ? new Date(project.deadline).toLocaleDateString()
                  : "No deadline set"}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Created
              </h3>
              <p className="text-sm">
                {project.created_at
                  ? new Date(project.created_at).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Delete Project"
        subtitle={`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}

export default function ProjectDetailsPage() {
  return (
    <PageAccessGuard pageUrl="/projects/[id]">
      <ProtectedRoute>
        <ProjectDetailsPageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
