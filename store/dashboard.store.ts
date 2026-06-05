import { create } from "zustand";
import { api_client } from "@/lib/api/api-client";
import type {
  DashboardKPIs,
  TaskStats,
  UpcomingDeadline,
  HighPriorityTask,
  ProjectSummary,
} from "@/services/dashboard.service";

interface DashboardState {
  kpis: DashboardKPIs | null;
  taskStats: TaskStats | null;
  upcomingDeadlines: UpcomingDeadline[];
  highPriorityTasks: HighPriorityTask[];
  projectSummaries: ProjectSummary[];
  recentActivitiesCount: number;
  isLoading: boolean;
  error: string | null;
}

interface DashboardActions {
  fetchDashboard: () => Promise<void>;
}

type DashboardStore = DashboardState & DashboardActions;

const initialState: DashboardState = {
  kpis: null,
  taskStats: null,
  upcomingDeadlines: [],
  highPriorityTasks: [],
  projectSummaries: [],
  recentActivitiesCount: 0,
  isLoading: false,
  error: null,
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  ...initialState,

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api_client.get("/dashboard");
      const data = res.data?.data;
      set({
        kpis: data?.kpis || null,
        taskStats: data?.task_stats || null,
        upcomingDeadlines: data?.upcoming_deadlines || [],
        highPriorityTasks: data?.high_priority_tasks || [],
        projectSummaries: data?.project_summaries || [],
        recentActivitiesCount: data?.recent_activities || 0,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to fetch dashboard";
      set({ error: message, isLoading: false });
    }
  },
}));
