import { getSupabaseServerClient } from "@/lib/api/supabase";
import { success, error } from "@/lib/api/api-response";
import type { Profile } from "@/types/db/profile.types";

export type CreateProfileParams = {
  user: string;
  email: string;
  name: string;
  username?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceResult<T = any> =
  | { success: true; data: T }
  | { success: false; error: string };

export class ProfileService {
  private static collection = "profiles";

  /**
   * Creates a new profile linked to an auth user via the `user` field (O2O relation).
   */
  static async create(
    params: CreateProfileParams,
  ): Promise<ServiceResult<Profile>> {
    try {
      const supabase = getSupabaseServerClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: sbError } = await (supabase as any)
        .from(this.collection)
        .insert({
          user: params.user,
          email: params.email,
          name: params.name,
          username: params.username ?? null,
          role: "user",
        })
        .select()
        .single();

      if (sbError) {
        return error(sbError.message);
      }

      return success(data as Profile);
    } catch (err) {
      return error((err as Error).message || "An unknown error occurred");
    }
  }

  /**
   * Fetch a single profile by its primary key.
   * Used by the `auth/me` endpoint to return the authenticated user's data.
   */
  static async getById(id: string): Promise<ServiceResult<Profile>> {
    try {
      const supabase = getSupabaseServerClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: sbError } = await (supabase as any)
        .from(this.collection)
        .select("*")
        .eq("id", id)
        .single();

      if (sbError) {
        return error(sbError.message);
      }

      if (!data) {
        return error("Profile not found");
      }

      return success(data as Profile);
    } catch (err) {
      return error((err as Error).message || "An unknown error occurred");
    }
  }
}
