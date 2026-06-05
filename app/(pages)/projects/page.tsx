"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, FolderKanban, Trash2, Calendar } from "lucide-react";
import { Badge } from "@/components/core/ui/badge";
import { ListPage } from "@/components/core/shared/list-page";
import { useProjectStore } from "@/store/project.store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { ConfirmationDialog } from "@/components/core/shared/ConfirmationDialog";
import { ProjectListCard } from "@/components/hr/projects/ProjectListCard";
import { useReturnUrl } from "@/hooks/use-return-url";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDateInTimezone } from "@/lib/date.utils";
import type { ListPageConfig } from "@/components/core/shared/list-page";
import type { ProjectListItem, ProjectStatus } from "@/types/db/project.types";

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

const ProjectsPageContent = () => {
  const router = useRouter();
  const { withReturnUrl } = useReturnUrl("/projects");

  const projects = useProjectStore((state) => state.items);
  const pagination = useProjectStore((state) => state.pagination);
  const loading = useProjectStore((state) => state.isLoading);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const refetchProjects = useProjectStore((state) => state.refetchProjects);
  const goToPage = useProjectStore((state) => state.goToPage);

  // Search — store-managed via debounced API calls
  const searchResults = useProjectStore((state) => state.searchResults);
  const isSearching = useProjectStore((state) => state.isSearching);
  const searchProjects = useProjectStore((state) => state.searchProjects);
  const clearSearch = useProjectStore((state) => state.clearSearch);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const nextPage = useProjectStore((state) => state.nextPage);
  const prevPage = useProjectStore((state) => state.prevPage);
  const deleteProject = useProjectStore((state) => state.deleteProject);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string>("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Debounced search — delegates to store
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      clearSearch();
      return;
    }
    searchProjects(debouncedSearch);
  }, [debouncedSearch, searchProjects, clearSearch]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Determine which data to show
  const displayData = searchResults !== null ? searchResults : (projects ?? []);

  const handleConfirmedDelete = async () => {
    if (pendingDeleteId === null) return;
    try {
      const result = await deleteProject(pendingDeleteId);
      if (result.success) {
        toast.success("Project deleted successfully");
      } else {
        toast.error(result.message || "Failed to delete project");
      }
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleDeleteClick = async (id: string, name: string) => {
    setPendingDeleteId(id);
    setPendingDeleteName(name);
    setIsConfirmOpen(true);
  };

  const config: ListPageConfig<ProjectListItem> = {
    resource: "project",
    title: "Projects",
    description: "Manage your projects and track progress",

    columns: [
      {
        key: "name",
        label: "Name",
        width: 30,
        sortable: true,
        searchable: true,
        render: (value, item) => (
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium">{item.name}</span>
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        width: 15,
        render: (value, item) => (
          <Badge variant={STATUS_VARIANTS[item.status]}>
            {STATUS_LABELS[item.status]}
          </Badge>
        ),
      },
      {
        key: "deadline",
        label: "Deadline",
        width: 15,
        sortable: true,
        render: (value) => {
          if (!value) return <span className="text-muted-foreground">—</span>;
          const dueDate = new Date(value as string);
          const tz = "Asia/Dhaka";
          const todayParts = new Intl.DateTimeFormat("en-CA", {
            timeZone: tz,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).formatToParts(new Date());
          const get = (type: string) =>
            parseInt(todayParts.find((p) => p.type === type)?.value || "0", 10);
          const todayInTz = new Date(
            get("year"),
            get("month") - 1,
            get("day"),
            0,
            0,
            0,
            0,
          );
          const isOverdue = dueDate < todayInTz;
          return (
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className={isOverdue ? "text-destructive" : ""}>
                {formatDateInTimezone(value as string)}
              </span>
            </div>
          );
        },
      },
      {
        key: "created_by",
        label: "Created By",
        width: 20,
        render: (value, item) => {
          const name =
            typeof item.created_by === "object" && item.created_by !== null
              ? (item.created_by as { name: string }).name
              : "—";
          return <span className="text-muted-foreground">{name}</span>;
        },
      },
      {
        key: "task_count",
        label: "Tasks",
        width: 10,
        render: (value) => (
          <Badge variant="secondary" className="font-mono">
            {value ?? 0}
          </Badge>
        ),
      },
    ],

    search: {
      fields: ["name"],
      placeholder: "Search projects...",
      onSearchChange: handleSearchChange,
    },

    filters: [
      {
        key: "status",
        label: "Status",
        placeholder: "All Statuses",
        options: [
          { label: "Draft", value: "DRAFT" },
          { label: "Active", value: "ACTIVE" },
          { label: "On Hold", value: "ON_HOLD" },
          { label: "Completed", value: "COMPLETED" },
        ],
      },
      {
        key: "deadline",
        label: "Deadline",
        placeholder: "All Deadlines",
        options: [
          { label: "Overdue", value: "overdue" },
          { label: "Upcoming", value: "upcoming" },
        ],
      },
    ],

    onFilterChange: (filters) => {
      fetchProjects({
        status: filters.status || undefined,
        deadlineStatus: filters.deadline || undefined,
      });
    },

    actions: {
      default: ["view", "edit", "delete"],
      pageActions: [
        {
          label: "Create Project",
          icon: Plus,
          variant: "default",
          onClick: () => router.push(withReturnUrl("/projects/create")),
        },
      ],
      bulk: {
        enabled: true,
        position: "bottom",
        showClearButton: true,
        actions: [
          {
            label: "Delete",
            icon: Trash2,
            variant: "destructive",
            onClick: (selectedIds) => {
              selectedIds.forEach((id) => deleteProject(id));
              toast.success("Selected projects deleted");
            },
            confirmMessage:
              "Are you sure you want to delete the selected projects?",
            requireSelection: true,
          },
        ],
      },
    },

    onRefresh: async () => {
      try {
        await refetchProjects();
        toast.success("Projects refreshed successfully");
      } catch {
        toast.error("Failed to refresh projects");
      }
    },

    onView: (project) => {
      router.push(withReturnUrl(`/projects/${project.id}`));
    },

    onEdit: (project) => {
      router.push(withReturnUrl(`/projects/${project.id}/edit`));
    },

    onDelete: async (id: string) => {
      const project = projects.find((p) => p.id === id);
      await handleDeleteClick(String(id), project?.name ?? "");
    },
  };

  return (
    <div className="">
      <ListPage
        data={displayData}
        loading={loading || isSearching}
        error={null}
        config={{
          ...config,
          pagination: pagination
            ? {
                pageSize: pagination.pageSize,
                pageSizeOptions: [5, 10, 20, 50],
                showPageSizeSelector: true,
                showQuickJumper: false,
                currentPage: pagination.currentPage,
                totalPages: pagination.totalPages,
                hasNext: pagination.hasNext,
                hasPrev: pagination.hasPrev,
                total: pagination.total,
                onNextPage: nextPage,
                onPrevPage: prevPage,
                onGoToPage: goToPage,
              }
            : undefined,
        }}
        mobileRender={(project) => (
          <ProjectListCard
            key={project.id}
            project={project}
            onEdit={() =>
              router.push(withReturnUrl(`/projects/${project.id}/edit`))
            }
            onDelete={() => handleDeleteClick(String(project.id), project.name)}
          />
        )}
      />

      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Delete Project"
        subtitle={`Are you sure you want to delete "${pendingDeleteName}"? This action cannot be undone.`}
        onConfirm={handleConfirmedDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
};

export default function ProjectsPage() {
  return (
    <PageAccessGuard pageUrl="/projects">
      <ProtectedRoute>
        <ProjectsPageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
