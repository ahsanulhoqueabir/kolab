import { getSupabaseServerClient } from "@/lib/api/supabase";
import { success, error } from "@/lib/api/api-response";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceResult<T = any> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface DashboardKPIs {
  total_projects: number;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
}

export interface TaskStats {
  by_priority: { priority: string; count: number }[];
  by_status: { status: string; count: number }[];
}

export interface UpcomingDeadline {
  id: string;
  title: string;
  due_date: string;
  priority: string;
  project_name: string;
}

export interface HighPriorityTask {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  project_name: string;
  assigned_to_name: string | null;
}

export interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  total_tasks: number;
  completed_tasks: number;
  deadline: string | null;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  task_stats: TaskStats;
  upcoming_deadlines: UpcomingDeadline[];
  high_priority_tasks: HighPriorityTask[];
  project_summaries: ProjectSummary[];
  recent_activities: number;
}

export class DashboardService {
  /**
   * Get all dashboard data aggregated.
   * Permission-aware: if user has dashboard:read:own, filter by their projects/tasks.
   */
  static async getAll(
    profileId: string,
    conditions?: { own?: boolean; all?: boolean },
  ): Promise<ServiceResult<DashboardData>> {
    try {
      const supabase = getSupabaseServerClient();
      const hasAll = conditions?.all;
      const hasOwn = conditions?.own;

      // ── KPIs ──────────────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let projectQuery = (supabase as any).from("project").select("id", {
        count: "exact",
        head: true,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let taskQuery = (supabase as any)
        .from("task")
        .select("id, status, due_date");

      if (!hasAll && hasOwn) {
        projectQuery = projectQuery.eq("created_by", profileId);
        taskQuery = taskQuery.eq("created_by", profileId);
      }

      const { count: totalProjects } = await projectQuery;

      const { data: allTasks } = await taskQuery;
      const taskList = allTasks || [];
      const totalTasks = taskList.length;
      const completedTasks = taskList.filter(
        (t: any) => t.status === "COMPLETED",
      ).length;
      const pendingTasks = taskList.filter(
        (t: any) => t.status !== "COMPLETED",
      ).length;
      const now = new Date().toISOString().split("T")[0];
      const overdueTasks = taskList.filter(
        (t: any) => t.status !== "COMPLETED" && t.due_date && t.due_date < now,
      ).length;

      // ── Task Stats ────────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let statsQuery = (supabase as any)
        .from("task")
        .select("priority, status");

      if (!hasAll && hasOwn) {
        statsQuery = statsQuery.eq("created_by", profileId);
      }

      const { data: statsData } = await statsQuery;
      const statsList = statsData || [];

      const priorityCounts: Record<string, number> = {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
      };
      const statusCounts: Record<string, number> = {
        TODO: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
      };

      statsList.forEach((t: any) => {
        if (t.priority && priorityCounts[t.priority] !== undefined) {
          priorityCounts[t.priority]++;
        }
        if (t.status && statusCounts[t.status] !== undefined) {
          statusCounts[t.status]++;
        }
      });

      const byPriority = Object.entries(priorityCounts).map(
        ([priority, count]) => ({ priority, count }),
      );
      const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));

      // ── Upcoming Deadlines (next 7 days) ──────────────────
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      const endDate = sevenDaysLater.toISOString().split("T")[0];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let upcomingQuery = (supabase as any)
        .from("task")
        .select("id, title, due_date, priority, project (id, name)")
        .not("due_date", "is", null)
        .gte("due_date", now)
        .lte("due_date", endDate)
        .neq("status", "COMPLETED")
        .order("due_date", { ascending: true })
        .limit(10);

      if (!hasAll && hasOwn) {
        upcomingQuery = upcomingQuery.eq("created_by", profileId);
      }

      const { data: upcomingData } = await upcomingQuery;
      const upcomingDeadlines: UpcomingDeadline[] = (upcomingData || []).map(
        (t: any) => ({
          id: t.id,
          title: t.title,
          due_date: t.due_date,
          priority: t.priority,
          project_name:
            typeof t.project === "object" && t.project !== null
              ? t.project.name
              : "Unknown",
        }),
      );

      // ── High Priority Tasks ──────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let highPrioQuery = (supabase as any)
        .from("task")
        .select(
          "id, title, status, due_date, priority, project (id, name), assigned_to (id, name)",
        )
        .eq("priority", "HIGH")
        .neq("status", "COMPLETED")
        .order("due_date", { ascending: true, nullsLast: true })
        .limit(10);

      if (!hasAll && hasOwn) {
        highPrioQuery = highPrioQuery.eq("created_by", profileId);
      }

      const { data: highPrioData } = await highPrioQuery;
      const highPriorityTasks: HighPriorityTask[] = (highPrioData || []).map(
        (t: any) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          due_date: t.due_date,
          project_name:
            typeof t.project === "object" && t.project !== null
              ? t.project.name
              : "Unknown",
          assigned_to_name:
            typeof t.assigned_to === "object" && t.assigned_to !== null
              ? t.assigned_to.name
              : null,
        }),
      );

      // ── Project Summaries ────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let projSummaryQuery = (supabase as any)
        .from("project")
        .select("id, name, status, deadline, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!hasAll && hasOwn) {
        projSummaryQuery = projSummaryQuery.eq("created_by", profileId);
      }

      const { data: projects } = await projSummaryQuery;
      const projectSummaries: ProjectSummary[] = await Promise.all(
        (projects || []).map(async (proj: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: projTasks } = await (supabase as any)
            .from("task")
            .select("status")
            .eq("project", proj.id);

          const taskList = projTasks || [];
          const total = taskList.length;
          const completed = taskList.filter(
            (t: any) => t.status === "COMPLETED",
          ).length;

          return {
            id: proj.id,
            name: proj.name,
            status: proj.status,
            total_tasks: total,
            completed_tasks: completed,
            deadline: proj.deadline,
          };
        }),
      );

      // ── Recent Activity Count ─────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: recentCount } = await (supabase as any)
        .from("logs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());

      return success({
        kpis: {
          total_projects: totalProjects || 0,
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          pending_tasks: pendingTasks,
          overdue_tasks: overdueTasks,
        },
        task_stats: {
          by_priority: byPriority,
          by_status: byStatus,
        },
        upcoming_deadlines: upcomingDeadlines,
        high_priority_tasks: highPriorityTasks,
        project_summaries: projectSummaries,
        recent_activities: recentCount || 0,
      });
    } catch (err) {
      return error((err as Error).message || "Failed to fetch dashboard data");
    }
  }
}
