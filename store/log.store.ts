import { create } from "zustand";
import { api_client } from "@/lib/api/api-client";
import type { LogListItem } from "@/types/db/logs.types";

interface LogState {
  logs: LogListItem[];
  isLoading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
}

interface LogActions {
  fetchLogs: (pageNum?: number, pageSize?: number) => Promise<void>;
  appendLogs: (pageNum: number, pageSize?: number) => Promise<void>;
  resetLogs: () => void;
}

type LogStore = LogState & LogActions;

const PAGE_SIZE = 20;

export const useLogStore = create<LogStore>((set, get) => ({
  logs: [],
  isLoading: false,
  error: null,
  page: 1,
  hasMore: true,

  fetchLogs: async (pageNum = 1, pageSize = PAGE_SIZE) => {
    set({ isLoading: true, error: null });
    try {
      const offset = (pageNum - 1) * pageSize;
      const res = await api_client.get(
        `/logs?limit=${pageSize}&offset=${offset}`,
      );
      const data = res.data?.data || [];
      set({
        logs: data,
        isLoading: false,
        page: pageNum,
        hasMore: data.length === pageSize,
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to load activities";
      set({ error: message, isLoading: false });
    }
  },

  appendLogs: async (pageNum: number, pageSize = PAGE_SIZE) => {
    set({ isLoading: true, error: null });
    try {
      const offset = (pageNum - 1) * pageSize;
      const res = await api_client.get(
        `/logs?limit=${pageSize}&offset=${offset}`,
      );
      const data = res.data?.data || [];
      set((state) => ({
        logs: [...state.logs, ...data],
        isLoading: false,
        page: pageNum,
        hasMore: data.length === pageSize,
      }));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to load activities";
      set({ error: message, isLoading: false });
    }
  },

  resetLogs: () => {
    set({ logs: [], isLoading: false, error: null, page: 1, hasMore: true });
  },
}));
