"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, FileText, Trash2, Calendar, User } from "lucide-react";
import { Badge } from "@/components/core/ui/badge";
import { ListPage } from "@/components/core/shared/list-page";
import { useTaskStore } from "@/store/task.store";
import { useProjectStore } from "@/store/project.store";
import { useUserStore } from "@/store/user.store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { ConfirmationDialog } from "@/components/core/shared/ConfirmationDialog";
import { TaskListCard } from "@/components/hr/tasks/TaskListCard";
import { TaskStatusBadge } from "@/components/hr/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/hr/tasks/TaskPriorityBadge";
import { useReturnUrl } from "@/hooks/use-return-url";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDateInTimezone } from "@/lib/date.utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";
import type { ListPageConfig } from "@/components/core/shared/list-page";
import type { TaskListItem } from "@/types/db/task.types";

const TasksPageContent = () => {
  const router = useRouter();
  const { withReturnUrl } = useReturnUrl("/tasks");

  const tasks = useTaskStore((state) => state.items);
  const pagination = useTaskStore((state) => state.pagination);
  const loading = useTaskStore((state) => state.isLoading);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const refetchTasks = useTaskStore((state) => state.refetchTasks);
  const goToPage = useTaskStore((state) => state.goToPage);
  const nextPage = useTaskStore((state) => state.nextPage);
  const prevPage = useTaskStore((state) => state.prevPage);
  const deleteTask = useTaskStore((state) => state.deleteTask);

  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const projects = useProjectStore((state) => state.items);
  const fetchUsers = useUserStore((state) => state.fetchUsers);
  const users = useUserStore((state) => state.items);

  // Search — store-managed via debounced API calls
  const searchResults = useTaskStore((state) => state.searchResults);
  const isSearching = useTaskStore((state) => state.isSearching);
  const searchTasks = useTaskStore((state) => state.searchTasks);
  const clearSearch = useTaskStore((state) => state.clearSearch);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string>("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [memberFilter, setMemberFilter] = useState<string>("");
  const [deadlineFilter, setDeadlineFilter] = useState<string>("");

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchUsers();
  }, [fetchTasks, fetchProjects, fetchUsers]);

  // Debounced search — delegates to store
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      clearSearch();
      return;
    }
    searchTasks(debouncedSearch);
  }, [debouncedSearch, searchTasks, clearSearch]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Determine which data to show
  const displayData = searchResults !== null ? searchResults : (tasks ?? []);

  // Apply filters
  useEffect(() => {
    fetchTasks({
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      project: projectFilter || undefined,
      assignedTo: memberFilter || undefined,
      deadlineStatus: deadlineFilter || undefined,
    });
  }, [
    statusFilter,
    priorityFilter,
    projectFilter,
    memberFilter,
    deadlineFilter,
    fetchTasks,
  ]);

  const handleConfirmedDelete = async () => {
    if (pendingDeleteId === null) return;
    try {
      const result = await deleteTask(pendingDeleteId);
      if (result.success) {
        toast.success("Task deleted successfully");
      } else {
        toast.error(result.message || "Failed to delete task");
      }
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleDeleteClick = async (id: string, name: string) => {
    setPendingDeleteId(id);
    setPendingDeleteName(name);
    setIsConfirmOpen(true);
  };

  const config: ListPageConfig<TaskListItem> = {
    resource: "task",
    title: "Tasks",
    description: "Manage and track all tasks across projects",

    columns: [
      {
        key: "title",
        label: "Title",
        width: 25,
        sortable: true,
        searchable: true,
        render: (value, item) => (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium">{item.title}</span>
          </div>
        ),
      },
      {
        key: "project",
        label: "Project",
        width: 15,
        render: (value, item) => {
          const name =
            typeof item.project === "object" && item.project !== null
              ? (item.project as { name: string }).name
              : "—";
          return <Badge variant="outline">{name}</Badge>;
        },
      },
      {
        key: "assigned_to",
        label: "Assigned To",
        width: 15,
        render: (value, item) => {
          const name =
            typeof item.assigned_to === "object" && item.assigned_to !== null
              ? (item.assigned_to as { name: string }).name
              : null;
          return name ? (
            <div className="flex items-center gap-1 text-sm">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              {name}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        key: "priority",
        label: "Priority",
        width: 10,
        render: (value, item) => <TaskPriorityBadge priority={item.priority} />,
      },
      {
        key: "status",
        label: "Status",
        width: 10,
        render: (value, item) => <TaskStatusBadge status={item.status} />,
      },
      {
        key: "due_date",
        label: "Due Date",
        width: 12,
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
    ],

    search: {
      fields: ["title", "description"],
      placeholder: "Search tasks...",
      onSearchChange: handleSearchChange,
    },

    actions: {
      default: ["edit", "delete"],
      pageActions: [
        {
          label: "Create Task",
          icon: Plus,
          variant: "default",
          onClick: () => router.push(withReturnUrl("/tasks/create")),
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
              selectedIds.forEach((id) => deleteTask(id));
              toast.success("Selected tasks deleted");
            },
            confirmMessage:
              "Are you sure you want to delete the selected tasks?",
            requireSelection: true,
          },
        ],
      },
    },

    onRefresh: async () => {
      try {
        await refetchTasks();
        toast.success("Tasks refreshed successfully");
      } catch {
        toast.error("Failed to refresh tasks");
      }
    },

    onEdit: (task) => {
      router.push(withReturnUrl(`/tasks/${task.id}/edit`));
    },

    onDelete: async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      await handleDeleteClick(String(id), task?.title ?? "");
    },
  };

  return (
    <div className="">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="w-40">
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) =>
              setStatusFilter(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <Select
            value={priorityFilter || "all"}
            onValueChange={(value) =>
              setPriorityFilter(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <Select
            value={projectFilter || "all"}
            onValueChange={(value) =>
              setProjectFilter(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <Select
            value={memberFilter || "all"}
            onValueChange={(value) =>
              setMemberFilter(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <Select
            value={deadlineFilter || "all"}
            onValueChange={(value) =>
              setDeadlineFilter(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Deadlines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Deadlines</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
        mobileRender={(task) => (
          <TaskListCard
            key={task.id}
            task={task}
            onEdit={() => router.push(withReturnUrl(`/tasks/${task.id}/edit`))}
            onDelete={() => handleDeleteClick(String(task.id), task.title)}
          />
        )}
      />

      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Delete Task"
        subtitle={`Are you sure you want to delete "${pendingDeleteName}"? This action cannot be undone.`}
        onConfirm={handleConfirmedDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
};

export default function TasksPage() {
  return (
    <PageAccessGuard pageUrl="/tasks">
      <ProtectedRoute>
        <TasksPageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
