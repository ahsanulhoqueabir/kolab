import { create } from "zustand";
import { api_client } from "@/lib/api/api-client";
import { useAuthStore } from "@/store/auth.store";
import type { Profile } from "@/types/db/profile.types";
import type { AuthUser } from "@/types/business/user.types";

// ─── Types ───────────────────────────────────────────────────────────────

export interface UpdateProfileParams {
  name?: string;
  phone?: string;
  image?: string;
  password?: string;
}

interface ProfileState {
  /** Whether an operation is in flight */
  isProcessing: boolean;
  /** Last error message */
  error: string | null;
}

interface ProfileActions {
  /**
   * Update own profile (name, phone, image, password).
   * Image handling (base64 → R2 upload) is done at the API route level.
   * On success, syncs the updated fields back to the auth store.
   */
  updateProfile: (
    data: UpdateProfileParams,
  ) => Promise<{ success: boolean; message?: string }>;
}

type ProfileStore = ProfileState & ProfileActions;

// ─── Defaults ────────────────────────────────────────────────────────────

const initialState: ProfileState = {
  isProcessing: false,
  error: null,
};

// ─── Store ───────────────────────────────────────────────────────────────

export const useProfileStore = create<ProfileStore>((set) => ({
  ...initialState,

  updateProfile: async (data) => {
    set({ isProcessing: true, error: null });

    try {
      const res = await api_client.patch("/profile", data);
      const responseData = res.data as {
        success: boolean;
        data?: Profile;
        message?: string;
      };

      if (responseData.success && responseData.data) {
        // Sync updated fields back to auth store (which is persisted)
        const authState = useAuthStore.getState();
        if (authState.user) {
          const updatedUser: AuthUser = {
            ...authState.user,
            name: responseData.data.name ?? authState.user.name,
            phone: responseData.data.phone ?? authState.user.phone,
            image: responseData.data.image ?? authState.user.image,
          };
          useAuthStore.setState({ user: updatedUser });
        }

        set({ isProcessing: false, error: null });
        return { success: true, message: responseData.message };
      }

      set({ isProcessing: false });
      return {
        success: false,
        message: "Failed to update profile",
      };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to update profile";
      set({ isProcessing: false, error: message });
      return { success: false, message };
    }
  },
}));
