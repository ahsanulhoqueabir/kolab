import { getSupabaseServerClient } from "@/lib/api/supabase";
import { success, error } from "@/lib/api/api-response";
import { todayInTimezone, dbTimestamp7DaysAgo } from "@/lib/date.utils";

type ServiceResult<T = unknown> =
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
      const projectQuery = supabase.from("project").select("id", {
        count: "exact",
        head: true,
      });
      const taskQuery = supabase.from("task").select("id, status, due_date");

      if (!hasAll && hasOwn) {
        projectQuery.eq("created_by", profileId);
        taskQuery.eq("created_by", profileId);
      }

      const { count: totalProjects } = await projectQuery;

      const { data: allTasks } = await taskQuery;
      const taskList = allTasks || [];
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

      // ── Task Stats ────────────────────────────────────────
      const statsQuery = supabase.from("task").select("priority, status");

      if (!hasAll && hasOwn) {
        statsQuery.eq("created_by", profileId);
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

      for (const t of statsList as Array<Record<string, unknown>>) {
        const p = t.priority as string;
        const s = t.status as string;
        if (p && priorityCounts[p] !== undefined) {
          priorityCounts[p]++;
        }
        if (s && statusCounts[s] !== undefined) {
          statusCounts[s]++;
        }
      }

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
      const endDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Dhaka",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(sevenDaysLater);

      const upcomingQuery = supabase
        .from("task")
        .select("id, title, due_date, priority, project (id, name)")
        .not("due_date", "is", null)
        .gte("due_date", now)
        .lte("due_date", endDate)
        .neq("status", "COMPLETED")
        .order("due_date", { ascending: true })
        .limit(10);

      if (!hasAll && hasOwn) {
        upcomingQuery.eq("created_by", profileId);
      }

      const { data: upcomingData } = await upcomingQuery;
      const upcomingDeadlines: UpcomingDeadline[] = (upcomingData || []).map(
        (t: Record<string, unknown>) => ({
          id: t.id as string,
          title: t.title as string,
          due_date: t.due_date as string,
          priority: t.priority as string,
          project_name:
            typeof t.project === "object" && t.project !== null
              ? (t.project as Record<string, string>).name
              : "Unknown",
        }),
      );

      // ── High Priority Tasks ──────────────────────────────
      const highPrioQuery = supabase
        .from("task")
        .select(
          "id, title, status, due_date, priority, project (id, name), assigned_to (id, name)",
        )
        .eq("priority", "HIGH")
        .neq("status", "COMPLETED")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(10);

      if (!hasAll && hasOwn) {
        highPrioQuery.eq("created_by", profileId);
      }

      const { data: highPrioData } = await highPrioQuery;
      const highPriorityTasks: HighPriorityTask[] = (highPrioData || []).map(
        (t: Record<string, unknown>) => ({
          id: t.id as string,
          title: t.title as string,
          status: t.status as string,
          due_date: t.due_date as string | null,
          project_name:
            typeof t.project === "object" && t.project !== null
              ? (t.project as Record<string, string>).name
              : "Unknown",
          assigned_to_name:
            typeof t.assigned_to === "object" && t.assigned_to !== null
              ? (t.assigned_to as Record<string, string>).name
              : null,
        }),
      );

      // ── Project Summaries ────────────────────────────────
      const projSummaryQuery = supabase
        .from("project")
        .select("id, name, status, deadline, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!hasAll && hasOwn) {
        projSummaryQuery.eq("created_by", profileId);
      }

      const { data: projects } = await projSummaryQuery;
      const projectSummaries: ProjectSummary[] = await Promise.all(
        (projects || []).map(async (proj: Record<string, unknown>) => {
          const { data: projTasks } = await supabase
            .from("task")
            .select("status")
            .eq("project", proj.id as string);

          const taskList = projTasks || [];
          const total = taskList.length;
          const completed = taskList.filter(
            (t: Record<string, unknown>) => t.status === "COMPLETED",
          ).length;

          return {
            id: proj.id as string,
            name: proj.name as string,
            status: proj.status as string,
            total_tasks: total,
            completed_tasks: completed,
            deadline: proj.deadline as string | null,
          };
        }),
      );

      // ── Recent Activity Count ─────────────────────────────
      const { count: recentCount } = await supabase
        .from("logs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", dbTimestamp7DaysAgo());

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
