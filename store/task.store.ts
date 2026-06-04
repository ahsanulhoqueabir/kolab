import { create } from "zustand";
import { api_client } from "@/lib/api/api-client";
import type {
  TaskListItem,
  CreateTaskParams,
  UpdateTaskParams,
  TaskStatus,
} from "@/types/db/task.types";

interface TaskState {
  tasks: TaskListItem[];
  isLoading: boolean;
  error: string | null;
}

interface TaskActions {
  fetchTasks: (filters?: {
    search?: string;
    status?: string;
    priority?: string;
    project?: string;
    assignedTo?: string;
    deadlineStatus?: string;
    page?: number;
    pageSize?: number;
  }) => Promise<void>;
  refetchTasks: () => Promise<void>;
  getTaskById: (id: string) => Promise<{
    success: boolean;
    data?: TaskListItem;
    message?: string;
  }>;
  createTask: (
    data: CreateTaskParams,
  ) => Promise<{ success: boolean; data?: TaskListItem; message?: string }>;
  updateTask: (
    id: string,
    data: UpdateTaskParams,
  ) => Promise<{ success: boolean; data?: TaskListItem; message?: string }>;
  deleteTask: (id: string) => Promise<{ success: boolean; message?: string }>;
  updateTaskStatus: (
    id: string,
    status: TaskStatus,
  ) => Promise<{ success: boolean; data?: TaskListItem; message?: string }>;
}

type TaskStore = TaskState & TaskActions;

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.set("search", filters.search);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.priority) params.set("priority", filters.priority);
      if (filters?.project) params.set("project", filters.project);
      if (filters?.assignedTo) params.set("assignedTo", filters.assignedTo);
      if (filters?.deadlineStatus)
        params.set("deadlineStatus", filters.deadlineStatus);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.pageSize) params.set("pageSize", String(filters.pageSize));

      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await api_client.get(`/tasks${query}`);
      set({
        tasks: res.data?.data?.tasks || [],
        isLoading: false,
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to fetch tasks";
      set({ error: message, isLoading: false });
    }
  },

  refetchTasks: async () => {
    await get().fetchTasks();
  },

  getTaskById: async (id: string) => {
    try {
      const res = await api_client.get(`/tasks/${id}`);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Task not found";
      return { success: false, message };
    }
  },

  createTask: async (data) => {
    try {
      const res = await api_client.post("/tasks", data);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to create task";
      return { success: false, message };
    }
  },

  updateTask: async (id, data) => {
    try {
      const res = await api_client.patch(`/tasks/${id}`, data);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to update task";
      return { success: false, message };
    }
  },

  deleteTask: async (id: string) => {
    try {
      await api_client.delete(`/tasks/${id}`);
      set({ tasks: get().tasks.filter((t) => t.id !== id) });
      return { success: true };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to delete task";
      return { success: false, message };
    }
  },

  updateTaskStatus: async (id, status) => {
    try {
      const res = await api_client.patch(`/tasks/${id}/status`, { status });
      // Update in local state
      set({
        tasks: get().tasks.map((t) => (t.id === id ? { ...t, status } : t)),
      });
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to update task status";
      return { success: false, message };
    }
  },
}));
