import { getSupabaseServerClient } from "@/lib/api/supabase";
import { success, error } from "@/lib/api/api-response";
import { LogService } from "@/services/log.service";
import { R2Service } from "@/services/r2.service";
import { paginated } from "@/lib/pagination";
import { dbTimestamp } from "@/lib/date.utils";
import type {
  Project,
  ProjectListItem,
  CreateProjectParams,
  UpdateProjectParams,
} from "@/types/db/project.types";
import type { PaginatedData } from "@/types/types";

type ServiceResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export class ProjectService {
  private static collection = "project";

  /**
   * Create a new project.
   */
  static async create(
    params: CreateProjectParams & { created_by: string },
  ): Promise<ServiceResult<Project>> {
    try {
      const supabase = getSupabaseServerClient();

      // Process base64 attachments → upload to R2 → get URLs
      const processedAttachments = params.attachment
        ? await R2Service.processAttachments(params.attachment, "projects")
        : [];

      const { data, error: sbError } = await supabase
        .from(this.collection)
        .insert({
          id: crypto.randomUUID(),
          name: params.name,
          description: params.description || null,
          deadline: params.deadline || null,
          status: params.status || "DRAFT",
          attachment: processedAttachments,
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
        table: "project",
        row: (data as Project).id,
        action: "CREATE",
        description: LogService.describeProject("CREATE", params.name),
      });

      return success(data as Project);
    } catch (err) {
      return error((err as Error).message || "Failed to create project");
    }
  }

  /**
   * List projects with filtering. Respects own/all conditions.
   * If profileId is provided and conditions indicate "own", filters by created_by.
   */
  static async list(filters?: {
    search?: string;
    status?: string;
    deadlineStatus?: string;
    profileId?: string;
    conditions?: { own?: boolean; all?: boolean };
    page?: number;
    pageSize?: number;
  }): Promise<ServiceResult<PaginatedData<ProjectListItem>>> {
    try {
      const supabase = getSupabaseServerClient();
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 50;
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      // Build query with task count via subquery
      const query = supabase
        .from(this.collection)
        .select(
          "id, name, description, deadline, status, created_by (id, name), created_at, updated_at",
          { count: "exact" },
        );

      // Own/All filtering
      const hasAll = filters?.conditions?.all;
      const hasOwn = filters?.conditions?.own;

      if (!hasAll && hasOwn && filters?.profileId) {
        query.eq("created_by", filters.profileId);
      }

      if (filters?.search) {
        query.ilike("name", `%${filters.search}%`);
      }

      if (filters?.status) {
        query.eq("status", filters.status);
      }

      if (filters?.deadlineStatus && filters.deadlineStatus !== "all") {
        if (filters.deadlineStatus === "overdue") {
          query
            .not("deadline", "is", null)
            .lt("deadline", new Date().toISOString().split("T")[0]);
        } else if (filters.deadlineStatus === "upcoming") {
          query
            .not("deadline", "is", null)
            .gte("deadline", new Date().toISOString().split("T")[0]);
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

      // Fetch task counts for each project
      const projects = (data || []) as unknown as ProjectListItem[];
      const projectsWithCounts = await Promise.all(
        projects.map(async (project) => {
          const { count: taskCount } = await supabase
            .from("task")
            .select("id", { count: "exact", head: true })
            .eq("project", project.id);

          return { ...project, task_count: taskCount || 0 };
        }),
      );

      return success(
        paginated(
          projectsWithCounts as unknown as ProjectListItem[],
          count || 0,
          page,
          pageSize,
        ),
      );
    } catch (err) {
      return error((err as Error).message || "Failed to fetch projects");
    }
  }

  /**
   * Find a single project by ID.
   */
  static async find(id: string): Promise<ServiceResult<Project>> {
    try {
      const supabase = getSupabaseServerClient();

      const { data, error: sbError } = await supabase
        .from(this.collection)
        .select("*, created_by (id, name), updated_by (id, name)")
        .eq("id", id)
        .single();

      if (sbError || !data) {
        return error(sbError?.message || "Project not found");
      }

      return success(data as Project);
    } catch (err) {
      return error((err as Error).message || "Failed to fetch project");
    }
  }

  /**
   * Update a project.
   */
  static async update(
    id: string,
    params: UpdateProjectParams & { updated_by?: string },
  ): Promise<ServiceResult<Project>> {
    try {
      const supabase = getSupabaseServerClient();

      // Process base64 attachments → upload to R2 → get URLs
      const processedAttachments = params.attachment
        ? await R2Service.processAttachments(params.attachment, "projects")
        : undefined;

      const updateData: Record<string, unknown> = {
        updated_at: dbTimestamp(),
      };

      if (params.name !== undefined) updateData.name = params.name;
      if (params.description !== undefined)
        updateData.description = params.description;
      if (params.deadline !== undefined) updateData.deadline = params.deadline;
      if (params.status !== undefined) updateData.status = params.status;
      if (processedAttachments !== undefined)
        updateData.attachment = processedAttachments;
      if (params.updated_by !== undefined)
        updateData.updated_by = params.updated_by;

      const { data, error: sbError } = await supabase
        .from(this.collection)
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (sbError || !data) {
        return error(sbError?.message || "Failed to update project");
      }

      // Fire-and-forget: log the update
      if (params.updated_by) {
        const project = data as Project;
        const extra = params.status
          ? `Status changed to ${params.status}`
          : undefined;
        LogService.create({
          actor: params.updated_by,
          table: "project",
          row: id,
          action: "UPDATE",
          description: LogService.describeProject(
            "UPDATE",
            project.name,
            extra,
          ),
        });
      }

      return success(data as Project);
    } catch (err) {
      return error((err as Error).message || "Failed to update project");
    }
  }

  /**
   * Delete a project by ID.
   */
  static async delete(
    id: string,
    actor?: string,
  ): Promise<ServiceResult<undefined>> {
    try {
      const supabase = getSupabaseServerClient();

      // Fetch project name before deleting for the log
      const { data: project } = await supabase
        .from(this.collection)
        .select("name")
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
      if (actor && project) {
        LogService.create({
          actor,
          table: "project",
          row: id,
          action: "DELETE",
          description: LogService.describeProject(
            "DELETE",
            (project as { name: string }).name,
          ),
        });
      }

      return success(undefined);
    } catch (err) {
      return error((err as Error).message || "Failed to delete project");
    }
  }

  /**
   * Minimal existence check.
   */
  static async valid(
    id: string,
  ): Promise<ServiceResult<{ id: string; name: string }>> {
    try {
      const supabase = getSupabaseServerClient();

      const { data, error: sbError } = await supabase
        .from(this.collection)
        .select("id, name")
        .eq("id", id)
        .single();

      if (sbError || !data) {
        return error(sbError?.message || "Project not found");
      }

      return success(data as { id: string; name: string });
    } catch (err) {
      return error((err as Error).message || "Failed to validate project");
    }
  }
}
