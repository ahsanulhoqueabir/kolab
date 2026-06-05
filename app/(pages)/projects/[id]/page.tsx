"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FolderKanban,
  Calendar,
  Edit,
  Trash2,
  ArrowLeft,
  Paperclip,
  ExternalLink,
  Clock,
  ListChecks,
} from "lucide-react";
import { formatDateInTimezone } from "@/lib/date.utils";
import { Badge } from "@/components/core/ui/badge";
import { Card, CardContent } from "@/components/core/ui/card";
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
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

  const deadlineDate = project.deadline ? new Date(project.deadline) : null;
  const isOverdue = deadlineDate && deadlineDate < new Date();
  const attachmentCount = project.attachment?.length ?? 0;

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
              <Badge variant={STATUS_VARIANTS[project.status as ProjectStatus]}>
                {STATUS_LABELS[project.status as ProjectStatus]}
              </Badge>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </p>
                <Badge
                  variant={STATUS_VARIANTS[project.status as ProjectStatus]}
                  className="text-sm px-3 py-1"
                >
                  {STATUS_LABELS[project.status as ProjectStatus]}
                </Badge>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <ListChecks className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Deadline
                </p>
                <p
                  className={`text-sm font-semibold ${isOverdue ? "text-destructive" : ""}`}
                >
                  {deadlineDate
                    ? formatDateInTimezone(project.deadline, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "No deadline"}
                </p>
                {deadlineDate && (
                  <p
                    className={`text-xs ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {isOverdue ? "Overdue" : "Pending"}
                  </p>
                )}
              </div>
              <div
                className={`h-9 w-9 rounded-lg flex items-center justify-center ${isOverdue ? "bg-destructive/10" : "bg-primary/10"}`}
              >
                <Calendar
                  className={`h-4 w-4 ${isOverdue ? "text-destructive" : "text-primary"}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </p>
                <p className="text-sm font-semibold">
                  {project.created_at
                    ? formatDateInTimezone(project.created_at, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  by {creatorName}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Attachments
                </p>
                <p className="text-sm font-semibold">
                  {attachmentCount} file{attachmentCount !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {attachmentCount > 0
                    ? "Click to view below"
                    : "No files attached"}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Paperclip className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {project.description && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              Description
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {project.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Attachments — External URL style */}
      {attachmentCount > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              Attachments ({attachmentCount})
            </h3>
            <div className="space-y-2">
              {project.attachment!.map((url, idx) => {
                const name = url.split("/").pop() || `file-${idx + 1}`;
                return (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/60 hover:border-muted-foreground/30"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Paperclip className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {url}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 ml-3 group-hover:text-primary transition-colors" />
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
