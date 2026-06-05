import { getSupabaseServerClient } from "@/lib/api/supabase";
import { success, error } from "@/lib/api/api-response";
import { LogService } from "@/services/log.service";
import { paginated } from "@/lib/pagination";
import { dbTimestamp, todayInTimezone } from "@/lib/date.utils";
import type {
  Team,
  TeamMember,
  AddMemberParams,
  WorkloadItem,
} from "@/types/db/team.types";
import type { PaginatedData } from "@/types/types";

type ServiceResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export class TeamService {
  private static collection = "team";

  /**
   * Add a member to a project.
   */
  static async addMember(
    params: AddMemberParams & { actor?: string },
  ): Promise<ServiceResult<Team>> {
    try {
      const supabase = getSupabaseServerClient();

      // Check if member already exists in this project
      const { data: existing } = await supabase
        .from(this.collection)
        .select("id")
        .eq("project", params.project)
        .eq("profile", params.profile)
        .limit(1);

      if (existing && existing.length > 0) {
        return error("Member already exists in this project");
      }

      // Fetch member and project names for the log
      const { data: profileData } = await supabase
        .from("profile")
        .select("name")
        .eq("id", params.profile)
        .single();

      const { data: projectData } = await supabase
        .from("project")
        .select("name")
        .eq("id", params.project)
        .single();

      const { data, error: sbError } = await supabase
        .from(this.collection)
        .insert({
          id: crypto.randomUUID(),
          project: params.project,
          profile: params.profile,
          role: params.role || "MEMBER",
          created_at: dbTimestamp(),
          updated_at: dbTimestamp(),
        })
        .select()
        .single();

      if (sbError) {
        return error(sbError.message);
      }

      // Fire-and-forget: log the member addition
      if (params.actor && profileData && projectData) {
        LogService.create({
          actor: params.actor,
          table: "team",
          row: params.project,
          action: "CREATE",
          description: LogService.describeMember(
            "ADD",
            (profileData as { name: string }).name,
            (projectData as { name: string }).name,
          ),
        });
      }

      return success(data as Team);
    } catch (err) {
      return error((err as Error).message || "Failed to add member");
    }
  }

  /**
   * Remove a member from a project.
   */
  static async removeMember(
    projectId: string,
    profileId: string,
    actor?: string,
  ): Promise<ServiceResult<undefined>> {
    try {
      const supabase = getSupabaseServerClient();

      // Fetch names before removing for the log
      const { data: profileData } = await supabase
        .from("profile")
        .select("name")
        .eq("id", profileId)
        .single();

      const { data: projectData } = await supabase
        .from("project")
        .select("name")
        .eq("id", projectId)
        .single();

      const { error: sbError } = await supabase
        .from(this.collection)
        .delete()
        .eq("project", projectId)
        .eq("profile", profileId);

      if (sbError) {
        return error(sbError.message);
      }

      // Fire-and-forget: log the member removal
      if (actor && profileData && projectData) {
        LogService.create({
          actor,
          table: "team",
          row: projectId,
          action: "DELETE",
          description: LogService.describeMember(
            "REMOVE",
            (profileData as { name: string }).name,
            (projectData as { name: string }).name,
          ),
        });
      }

      return success(undefined);
    } catch (err) {
      return error((err as Error).message || "Failed to remove member");
    }
  }

  /**
   * List team members of a project.
   */
  static async listByProject(
    projectId: string,
    filters?: {
      search?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<ServiceResult<PaginatedData<TeamMember>>> {
    try {
      const supabase = getSupabaseServerClient();
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 50;
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      const query = supabase
        .from(this.collection)
        .select(
          "id, project (id, name), profile (id, name, email, image), role, created_at",
          { count: "exact" },
        )
        .eq("project", projectId);

      if (filters?.search) {
        query.or(
          `profile.name.ilike.%${filters.search}%,profile.email.ilike.%${filters.search}%`,
        );
      }

      const {
        data,
        error: sbError,
        count,
      } = await query
        .order("created_at", { ascending: true })
        .range(start, end);

      if (sbError) {
        return error(sbError.message);
      }

      return success(
        paginated(
          (data || []) as unknown as TeamMember[],
          count || 0,
          page,
          pageSize,
        ),
      );
    } catch (err) {
      return error((err as Error).message || "Failed to fetch team members");
    }
  }

  /**
   * List projects where a user is a member.
   */
  static async listByMember(
    profileId: string,
  ): Promise<ServiceResult<TeamMember[]>> {
    try {
      const supabase = getSupabaseServerClient();

      const { data, error: sbError } = await supabase
        .from(this.collection)
        .select(
          "id, project (id, name), profile (id, name, email, image), role, created_at",
        )
        .eq("profile", profileId)
        .order("created_at", { ascending: false });

      if (sbError) {
        return error(sbError.message);
      }

      return success((data || []) as unknown as TeamMember[]);
    } catch (err) {
      return error((err as Error).message || "Failed to fetch member projects");
    }
  }

  /**
   * Unified team listing that respects permission conditions.
   *
   * - If `all` is true: returns ALL team entries, grouped by project.
   * - If `own` is true: returns only entries where the profile matches and role is MANAGER.
   */
  static async listUnified(params: {
    profileId: string;
    conditions: { all?: boolean; own?: boolean };
  }): Promise<ServiceResult<TeamMember[]>> {
    try {
      const supabase = getSupabaseServerClient();

      const query = supabase
        .from(this.collection)
        .select(
          "id, project (id, name), profile (id, name, email, image), role, created_at",
        )
        .order("created_at", { ascending: true });

      if (params.conditions.all) {
        // Return all — no extra filter
      } else if (params.conditions.own) {
        // Only MANAGER entries for this profile
        query.eq("profile", params.profileId).eq("role", "MANAGER");
      } else {
        // Fallback: own
        query.eq("profile", params.profileId).eq("role", "MANAGER");
      }

      const { data, error: sbError } = await query;

      if (sbError) {
        return error(sbError.message);
      }

      return success((data || []) as unknown as TeamMember[]);
    } catch (err) {
      return error((err as Error).message || "Failed to fetch unified team");
    }
  }

  /**
   * Get workload summary per member.
   * If projectId is provided, scoped to that project.
   */
  static async getWorkload(
    projectId?: string,
  ): Promise<ServiceResult<WorkloadItem[]>> {
    try {
      const supabase = getSupabaseServerClient();

      // Get all team members (optionally filtered by project)
      const membersQuery = supabase
        .from(this.collection)
        .select("id, profile (id, name), project");

      if (projectId) {
        membersQuery.eq("project", projectId);
      }

      const { data: members, error: membersError } = await membersQuery;

      if (membersError) {
        return error(membersError.message);
      }

      if (!members || members.length === 0) {
        return success([]);
      }

      // For each member, count their tasks
      const workloadItems: WorkloadItem[] = await Promise.all(
        members.map(async (member: Record<string, unknown>) => {
          const profileId =
            typeof member.profile === "object" && member.profile !== null
              ? (member.profile as Record<string, string>).id
              : (member.profile as string);
          const profileName =
            typeof member.profile === "object" && member.profile !== null
              ? (member.profile as Record<string, string>).name
              : "Unknown";

          // Build task query for this member
          const taskQuery = supabase
            .from("task")
            .select("id, status, due_date", { count: "exact" })
            .eq("assigned_to", profileId);

          if (projectId) {
            taskQuery.eq("project", projectId);
          }

          const { data: tasks } = await taskQuery;

          const taskList = tasks || [];
          const totalTasks = taskList.length;
          const completedTasks = taskList.filter(
            (t: Record<string, unknown>) => t.status === "COMPLETED",
          ).length;
          const pendingTasks = taskList.filter(
            (t: Record<string, unknown>) => t.status !== "COMPLETED",
          ).length;
          const now = todayInTimezone();
          const overdueTasks = taskList.filter(
            (t: Record<string, unknown>) =>
              t.status !== "COMPLETED" && t.due_date && t.due_date < now,
          ).length;

          return {
            profile_id: profileId,
            profile_name: profileName,
            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            pending_tasks: pendingTasks,
            overdue_tasks: overdueTasks,
          };
        }),
      );

      return success(workloadItems);
    } catch (err) {
      return error((err as Error).message || "Failed to fetch workload");
    }
  }
}
