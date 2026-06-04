import { create } from "zustand";
import { api_client } from "@/lib/api/api-client";
import type {
  UserListItem,
  CreateUserParams,
  UpdateUserParams,
} from "@/types/db/user.types";

interface UserState {
  users: UserListItem[];
  isLoading: boolean;
  error: string | null;
}

interface UserActions {
  fetchUsers: (filters?: {
    search?: string;
    role?: string;
    active?: boolean;
    page?: number;
    pageSize?: number;
  }) => Promise<void>;
  refetchUsers: () => Promise<void>;
  getUserById: (
    id: string,
  ) => Promise<{ success: boolean; data?: UserListItem; message?: string }>;
  createUser: (
    data: CreateUserParams,
  ) => Promise<{ success: boolean; data?: UserListItem; message?: string }>;
  updateUser: (
    id: string,
    data: UpdateUserParams,
  ) => Promise<{ success: boolean; data?: UserListItem; message?: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; message?: string }>;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.set("search", filters.search);
      if (filters?.role) params.set("role", filters.role);
      if (filters?.active !== undefined)
        params.set("active", String(filters.active));
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.pageSize) params.set("pageSize", String(filters.pageSize));

      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await api_client.get(`/users${query}`);
      set({
        users: res.data?.data?.users || [],
        isLoading: false,
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to fetch users";
      set({ error: message, isLoading: false });
    }
  },

  refetchUsers: async () => {
    await get().fetchUsers();
  },

  getUserById: async (id: string) => {
    try {
      const res = await api_client.get(`/users/${id}`);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "User not found";
      return { success: false, message };
    }
  },

  createUser: async (data) => {
    try {
      const res = await api_client.post("/users", data);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to create user";
      return { success: false, message };
    }
  },

  updateUser: async (id, data) => {
    try {
      const res = await api_client.patch(`/users/${id}`, data);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to update user";
      return { success: false, message };
    }
  },

  deleteUser: async (id: string) => {
    try {
      await api_client.delete(`/users/${id}`);
      set({ users: get().users.filter((u) => u.id !== id) });
      return { success: true };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to delete user";
      return { success: false, message };
    }
  },
}));
