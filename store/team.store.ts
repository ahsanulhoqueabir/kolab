import { create } from "zustand";
import { api_client } from "@/lib/api/api-client";
import type {
  TeamMember,
  AddMemberParams,
  WorkloadItem,
} from "@/types/db/team.types";

interface TeamState {
  members: TeamMember[];
  workload: WorkloadItem[];
  isLoading: boolean;
  error: string | null;
}

interface TeamActions {
  fetchTeamMembers: (projectId: string) => Promise<void>;
  addMember: (
    params: AddMemberParams,
  ) => Promise<{ success: boolean; data?: TeamMember; message?: string }>;
  removeMember: (
    projectId: string,
    profileId: string,
  ) => Promise<{ success: boolean; message?: string }>;
  fetchWorkload: (projectId?: string) => Promise<void>;
}

type TeamStore = TeamState & TeamActions;

export const useTeamStore = create<TeamStore>((set, get) => ({
  members: [],
  workload: [],
  isLoading: false,
  error: null,

  fetchTeamMembers: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api_client.get(`/team?projectId=${projectId}`);
      set({
        members: res.data?.data || [],
        isLoading: false,
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to fetch team members";
      set({ error: message, isLoading: false });
    }
  },

  addMember: async (params) => {
    try {
      const res = await api_client.post("/team", params);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to add member";
      return { success: false, message };
    }
  },

  removeMember: async (projectId, profileId) => {
    try {
      await api_client.delete(`/team/${profileId}?projectId=${projectId}`);
      return { success: true };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to remove member";
      return { success: false, message };
    }
  },

  fetchWorkload: async (projectId?: string) => {
    try {
      const query = projectId ? `?projectId=${projectId}` : "";
      const res = await api_client.get(`/team/workload${query}`);
      set({ workload: res.data?.data || [] });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to fetch workload";
      set({ error: message });
    }
  },
}));
