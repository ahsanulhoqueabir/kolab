import { getSupabaseServerClient } from "@/lib/api/supabase";
import { success, error } from "@/lib/api/api-response";
import { LogService } from "@/services/log.service";
import { paginated } from "@/lib/pagination";
import {
  dbTimestamp,
  todayInTimezone,
  todayStartInTimezone,
} from "@/lib/date.utils";
import type {
  Task,
  TaskListItem,
  CreateTaskParams,
  UpdateTaskParams,
  TaskStatus,
} from "@/types/db/task.types";
import type { PaginatedData } from "@/types/types";

type ServiceResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export class TaskService {
  private static collection = "task";

  /**
   * Create a new task with validation.
   */
  static async create(
    params: CreateTaskParams & { created_by: string },
  ): Promise<ServiceResult<Task>> {
    try {
      const supabase = getSupabaseServerClient();

      // Validate: prevent duplicate task titles inside the same project
      const { data: existing } = await supabase
        .from(this.collection)
        .select("id")
        .eq("project", params.project)
        .eq("title", params.title)
        .limit(1);

      if (existing && existing.length > 0) {
        return error("A task with this title already exists in the project");
      }

      // Validate: prevent setting past dates as deadlines
      if (params.due_date) {
        const dueDate = new Date(params.due_date);
        const today = todayStartInTimezone();
        if (dueDate < today) {
          return error("Due date cannot be in the past");
        }
      }

      const { data, error: sbError } = await supabase
        .from(this.collection)
        .insert({
          title: params.title,
          description: params.description || null,
          assigned_to: params.assigned_to || null,
          due_date: params.due_date || null,
          priority: params.priority || "MEDIUM",
          status: params.status || "TODO",
          project: params.project,
          created_by: params.created_by,
          created_at: dbTimestamp(),
          updated_at: dbTimestamp(),
        })
        .select()
        .single();

      if (sbError) {
        return error(sbError.message);
      }

      // Fire-and-forget: log the creation
      LogService.create({
        actor: params.created_by,
        table: "task",
        row: (data as Task).id,
        action: "CREATE",
        description: LogService.describeTask("CREATE", params.title),
      });

      return success(data as Task);
    } catch (err) {
      return error((err as Error).message || "Failed to create task");
    }
  }

  /**
   * List tasks with filtering. Respects own/assigned/all conditions.
   */
  static async list(filters?: {
    search?: string;
    status?: string;
    priority?: string;
    project?: string;
    assignedTo?: string;
    deadlineStatus?: string;
    profileId?: string;
    conditions?: { own?: boolean; all?: boolean; assigned?: boolean };
    page?: number;
    pageSize?: number;
  }): Promise<ServiceResult<PaginatedData<TaskListItem>>> {
    try {
      const supabase = getSupabaseServerClient();
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 50;
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      const query = supabase
        .from(this.collection)
        .select(
          "id, title, description, due_date, priority, status, project (id, name), assigned_to (id, name), created_by (id, name), created_at, updated_at",
          { count: "exact" },
        );

      // Own/All/Assigned filtering
      const hasAll = filters?.conditions?.all;
      const hasOwn = filters?.conditions?.own;
      const hasAssigned = filters?.conditions?.assigned;

      if (!hasAll && filters?.profileId) {
        if (hasOwn && hasAssigned) {
          query.or(
            `created_by.eq.${filters.profileId},assigned_to.eq.${filters.profileId}`,
          );
        } else if (hasOwn) {
          query.eq("created_by", filters.profileId);
        } else if (hasAssigned) {
          query.eq("assigned_to", filters.profileId);
        }
      }

      if (filters?.search) {
        query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
        );
      }

      if (filters?.status) {
        const statuses = filters.status.split(",");
        if (statuses.length === 1) {
          query.eq("status", filters.status);
        } else {
          query.in("status", statuses);
        }
      }

      if (filters?.priority) {
        query.eq("priority", filters.priority);
      }

      if (filters?.project) {
        query.eq("project", filters.project);
      }

      if (filters?.assignedTo) {
        query.eq("assigned_to", filters.assignedTo);
      }

      if (filters?.deadlineStatus && filters.deadlineStatus !== "all") {
        if (filters.deadlineStatus === "overdue") {
          query
            .not("due_date", "is", null)
            .lt("due_date", todayInTimezone())
            .neq("status", "COMPLETED");
        } else if (filters.deadlineStatus === "upcoming") {
          query.not("due_date", "is", null).gte("due_date", todayInTimezone());
        }
      }

      const {
        data,
        error: sbError,
        count,
      } = await query
        .order("created_at", { ascending: false })
        .range(start, end);

      if (sbError) {
        return error(sbError.message);
      }

      return success(
        paginated(
          (data || []) as unknown as TaskListItem[],
          count || 0,
          page,
          pageSize,
        ),
      );
    } catch (err) {
      return error((err as Error).message || "Failed to fetch tasks");
    }
  }

  /**
   * Search tasks by title (partial match). Returns max 10 results.
   */
  static async search(value: string): Promise<ServiceResult<TaskListItem[]>> {
    try {
      const supabase = getSupabaseServerClient();

      const { data, error: sbError } = await supabase
        .from(this.collection)
        .select(
          "id, title, description, due_date, priority, status, project (id, name), assigned_to (id, name), created_at",
        )
        .ilike("title", `%${value}%`)
        .order("created_at", { ascending: false })
        .limit(10);

      if (sbError) return error(sbError.message);
      return success((data || []) as unknown as TaskListItem[]);
    } catch (err) {
      return error((err as Error).message || "Failed to search tasks");
    }
  }

  /**
   * Find a single task by ID.
   */
  static async find(id: string): Promise<ServiceResult<Task>> {
    try {
      const supabase = getSupabaseServerClient();

      const { data, error: sbError } = await supabase
        .from(this.collection)
        .select(
          "*, project (id, name), assigned_to (id, name), created_by (id, name), updated_by (id, name)",
        )
        .eq("id", id)
        .single();

      if (sbError || !data) {
        return error(sbError?.message || "Task not found");
      }

      return success(data as Task);
    } catch (err) {
      return error((err as Error).message || "Failed to fetch task");
    }
  }

  /**
   * Update a task with validation.
   */
  static async update(
    id: string,
    params: UpdateTaskParams & { updated_by?: string },
  ): Promise<ServiceResult<Task>> {
    try {
      const supabase = getSupabaseServerClient();

      // Validate: prevent duplicate task titles inside the same project
      if (params.title) {
        // Get the current task to know its project
        const { data: current } = await supabase
          .from(this.collection)
          .select("project, title")
          .eq("id", id)
          .single();

        if (current) {
          const projectId =
            params.project ||
            ((current as Record<string, unknown>).project as string);
          const newTitle = params.title;

          const { data: duplicate } = await supabase
            .from(this.collection)
            .select("id")
            .eq("project", projectId)
            .eq("title", newTitle)
            .neq("id", id)
            .limit(1);

          if (duplicate && duplicate.length > 0) {
            return error(
              "A task with this title already exists in the project",
            );
          }
        }
      }

      // Validate: prevent setting past dates as deadlines
      if (params.due_date) {
        const dueDate = new Date(params.due_date);
        const today = todayStartInTimezone();
        if (dueDate < today) {
          return error("Due date cannot be in the past");
        }
      }

      const updateData: Record<string, unknown> = {
        updated_at: dbTimestamp(),
      };

      if (params.title !== undefined) updateData.title = params.title;
      if (params.description !== undefined)
        updateData.description = params.description;
      if (params.assigned_to !== undefined)
        updateData.assigned_to = params.assigned_to;
      if (params.due_date !== undefined) updateData.due_date = params.due_date;
      if (params.priority !== undefined) updateData.priority = params.priority;
      if (params.status !== undefined) updateData.status = params.status;
      if (params.project !== undefined) updateData.project = params.project;
      if (params.comment !== undefined) updateData.comment = params.comment;
      if (params.attachment !== undefined)
        updateData.attachment = params.attachment;
      if (params.updated_by !== undefined)
        updateData.updated_by = params.updated_by;

      const { data, error: sbError } = await supabase
        .from(this.collection)
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (sbError || !data) {
        return error(sbError?.message || "Failed to update task");
      }

      // Fire-and-forget: log the update
      if (params.updated_by) {
        const task = data as Task;
        const extra = params.status
          ? `Status changed to ${params.status.replace("_", " ")}`
          : undefined;
        LogService.create({
          actor: params.updated_by,
          table: "task",
          row: id,
          action: "UPDATE",
          description: LogService.describeTask("UPDATE", task.title, extra),
        });
      }

      return success(data as Task);
    } catch (err) {
      return error((err as Error).message || "Failed to update task");
    }
  }

  /**
   * Quick status update (for drag-drop or checkbox).
   */
  static async updateStatus(
    id: string,
    status: TaskStatus,
    updated_by?: string,
  ): Promise<ServiceResult<Task>> {
    try {
      const supabase = getSupabaseServerClient();

      // Prevent assigning completed tasks — no special logic needed,
      // but we validate the status value is valid.
      if (!["TODO", "IN_PROGRESS", "COMPLETED"].includes(status)) {
        return error("Invalid status value");
      }

      const { data, error: sbError } = await supabase
        .from(this.collection)
        .update({
          status,
          updated_at: dbTimestamp(),
          ...(updated_by ? { updated_by } : {}),
        })
        .eq("id", id)
        .select()
        .single();

      if (sbError || !data) {
        return error(sbError?.message || "Failed to update task status");
      }

      // Fire-and-forget: log the status change
      if (updated_by) {
        const task = data as Task;
        LogService.create({
          actor: updated_by,
          table: "task",
          row: id,
          action: "UPDATE",
          description: LogService.describeTaskStatus(task.title, status),
        });
      }

      return success(data as Task);
    } catch (err) {
      return error((err as Error).message || "Failed to update task status");
    }
  }

  /**
   * Delete a task.
   */
  static async delete(
    id: string,
    actor?: string,
  ): Promise<ServiceResult<undefined>> {
    try {
      const supabase = getSupabaseServerClient();

      // Fetch task title before deleting for the log
      const { data: task } = await supabase
        .from(this.collection)
        .select("title")
        .eq("id", id)
        .single();

      const { error: sbError } = await supabase
        .from(this.collection)
        .delete()
        .eq("id", id);

      if (sbError) {
        return error(sbError.message);
      }

      // Fire-and-forget: log the deletion
      if (actor && task) {
        LogService.create({
          actor,
          table: "task",
          row: id,
          action: "DELETE",
          description: LogService.describeTask(
            "DELETE",
            (task as { title: string }).title,
          ),
        });
      }

      return success(undefined);
    } catch (err) {
      return error((err as Error).message || "Failed to delete task");
    }
  }

  /**
   * List tasks by project.
   */
  static async listByProject(
    projectId: string,
    filters?: {
      status?: string;
      priority?: string;
      assignedTo?: string;
    },
  ): Promise<ServiceResult<TaskListItem[]>> {
    try {
      const supabase = getSupabaseServerClient();

      const query = supabase
        .from(this.collection)
        .select(
          "id, title, description, due_date, priority, status, project (id, name), assigned_to (id, name), created_by (id, name), created_at, updated_at",
        )
        .eq("project", projectId);

      if (filters?.status) {
        query.eq("status", filters.status);
      }

      if (filters?.priority) {
        query.eq("priority", filters.priority);
      }

      if (filters?.assignedTo) {
        query.eq("assigned_to", filters.assignedTo);
      }

      const { data, error: sbError } = await query.order("created_at", {
        ascending: false,
      });

      if (sbError) {
        return error(sbError.message);
      }

      return success((data || []) as unknown as TaskListItem[]);
    } catch (err) {
      return error((err as Error).message || "Failed to fetch project tasks");
    }
  }
}
