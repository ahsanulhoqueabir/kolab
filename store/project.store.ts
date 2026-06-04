import { create } from "zustand";
import { api_client } from "@/lib/api/api-client";
import type {
  ProjectListItem,
  CreateProjectParams,
  UpdateProjectParams,
} from "@/types/db/project.types";

interface ProjectState {
  projects: ProjectListItem[];
  isLoading: boolean;
  error: string | null;
}

interface ProjectActions {
  fetchProjects: (filters?: {
    search?: string;
    status?: string;
    deadlineStatus?: string;
    page?: number;
    pageSize?: number;
  }) => Promise<void>;
  refetchProjects: () => Promise<void>;
  getProjectById: (id: string) => Promise<{
    success: boolean;
    data?: ProjectListItem;
    message?: string;
  }>;
  createProject: (
    data: CreateProjectParams,
  ) => Promise<{ success: boolean; data?: ProjectListItem; message?: string }>;
  updateProject: (
    id: string,
    data: UpdateProjectParams,
  ) => Promise<{ success: boolean; data?: ProjectListItem; message?: string }>;
  deleteProject: (
    id: string,
  ) => Promise<{ success: boolean; message?: string }>;
}

type ProjectStore = ProjectState & ProjectActions;

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  fetchProjects: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.set("search", filters.search);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.deadlineStatus)
        params.set("deadlineStatus", filters.deadlineStatus);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.pageSize) params.set("pageSize", String(filters.pageSize));

      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await api_client.get(`/projects${query}`);
      set({
        projects: res.data?.data?.projects || [],
        isLoading: false,
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to fetch projects";
      set({ error: message, isLoading: false });
    }
  },

  refetchProjects: async () => {
    await get().fetchProjects();
  },

  getProjectById: async (id: string) => {
    try {
      const res = await api_client.get(`/projects/${id}`);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Project not found";
      return { success: false, message };
    }
  },

  createProject: async (data) => {
    try {
      const res = await api_client.post("/projects", data);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to create project";
      return { success: false, message };
    }
  },

  updateProject: async (id, data) => {
    try {
      const res = await api_client.patch(`/projects/${id}`, data);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to update project";
      return { success: false, message };
    }
  },

  deleteProject: async (id: string) => {
    try {
      await api_client.delete(`/projects/${id}`);
      set({ projects: get().projects.filter((p) => p.id !== id) });
      return { success: true };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to delete project";
      return { success: false, message };
    }
  },
}));
