import { getSupabaseServerClient } from "@/lib/api/supabase";
import { success, error } from "@/lib/api/api-response";
import { LogService } from "@/services/log.service";
import type {
  Team,
  TeamMember,
  AddMemberParams,
  WorkloadItem,
} from "@/types/db/team.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceResult<T = any> =
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase as any)
        .from(this.collection)
        .select("id")
        .eq("project", params.project)
        .eq("profile", params.profile)
        .limit(1);

      if (existing && existing.length > 0) {
        return error("Member already exists in this project");
      }

      // Fetch member and project names for the log
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileData } = await (supabase as any)
        .from("profile")
        .select("name")
        .eq("id", params.profile)
        .single();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: projectData } = await (supabase as any)
        .from("project")
        .select("name")
        .eq("id", params.project)
        .single();

      const { data, error: sbError } = await (supabase as any)
        .from(this.collection)
        .insert({
          id: crypto.randomUUID(),
          project: params.project,
          profile: params.profile,
          role: params.role || "MEMBER",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileData } = await (supabase as any)
        .from("profile")
        .select("name")
        .eq("id", profileId)
        .single();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: projectData } = await (supabase as any)
        .from("project")
        .select("name")
        .eq("id", projectId)
        .single();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: sbError } = await (supabase as any)
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
  ): Promise<ServiceResult<TeamMember[]>> {
    try {
      const supabase = getSupabaseServerClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: sbError } = await (supabase as any)
        .from(this.collection)
        .select(
          "id, project (id, name), profile (id, name, email, image), role, created_at",
        )
        .eq("project", projectId)
        .order("created_at", { ascending: true });

      if (sbError) {
        return error(sbError.message);
      }

      return success((data || []) as TeamMember[]);
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: sbError } = await (supabase as any)
        .from(this.collection)
        .select(
          "id, project (id, name), profile (id, name, email, image), role, created_at",
        )
        .eq("profile", profileId)
        .order("created_at", { ascending: false });

      if (sbError) {
        return error(sbError.message);
      }

      return success((data || []) as TeamMember[]);
    } catch (err) {
      return error((err as Error).message || "Failed to fetch member projects");
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let membersQuery = (supabase as any)
        .from(this.collection)
        .select("id, profile (id, name), project");

      if (projectId) {
        membersQuery = membersQuery.eq("project", projectId);
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
        members.map(async (member: any) => {
          const profileId =
            typeof member.profile === "object" && member.profile !== null
              ? member.profile.id
              : member.profile;
          const profileName =
            typeof member.profile === "object" && member.profile !== null
              ? member.profile.name
              : "Unknown";

          // Build task query for this member
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let taskQuery = (supabase as any)
            .from("task")
            .select("id, status, due_date", { count: "exact" })
            .eq("assigned_to", profileId);

          if (projectId) {
            taskQuery = taskQuery.eq("project", projectId);
          }

          const { data: tasks } = await taskQuery;

          const taskList = tasks || [];
          const totalTasks = taskList.length;
          const completedTasks = taskList.filter(
            (t: any) => t.status === "COMPLETED",
          ).length;
          const pendingTasks = taskList.filter(
            (t: any) => t.status !== "COMPLETED",
          ).length;
          const now = new Date().toISOString().split("T")[0];
          const overdueTasks = taskList.filter(
            (t: any) =>
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
