import { getSupabaseServerClient } from "@/lib/api/supabase";
import { success, error } from "@/lib/api/api-response";
import type { Profile } from "@/types/db/profile.types";
import { RoleService } from "./role.services";

export type CreateProfileParams = {
  email: string;
  name: string;
  password?: string;
  role?: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceResult<T = any> =
  | { success: true; data: T }
  | { success: false; error: string };

export class ProfileService {
  private static table = "profile";
  private static fields = {
    basic:
      "id, name, email, phone, image, role (id, name, permissions, pages, landing_page), active, created_at, updated_at",
    with_permissions: "id, active, role (id, name, permissions)",
    /** Includes password — only for auth internal use */
    with_password: "id, name,email, password, role (id, name), active",
  };

  /**
   * Fetch a profile with its role's permissions in one query.
   * Returns failure when the profile is not found.
   */
  static async permissions(id: string) {
    try {
      const supabase = getSupabaseServerClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile, error: sbError } = await (supabase as any)
        .from(this.table)
        .select(this.fields.with_permissions)
        .eq("id", id)
        .single();

      if (sbError || !profile) {
        return error(sbError?.message || "Profile not found");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const roleObj = profile.role as any;
      const permissions: string[] =
        roleObj?.permissions?.map((p: { name: string }) => p.name) ?? [];

      return success({
        active: !!profile.active,
        roleId: roleObj?.id as string,
        roleName: roleObj?.name as string,
        permissions,
      });
    } catch (err) {
      return error(
        (err as Error).message || "Failed to fetch profile permissions",
      );
    }
  }

  /**
   * Creates a new profile directly in the database.
   */
  static async create(
    params: CreateProfileParams,
  ): Promise<ServiceResult<Profile>> {
    try {
      const supabase = getSupabaseServerClient();

      // Resolve role — use RoleService instead of querying role table directly
      let roleId: string | null = null;
      if (params.role) {
        roleId = params.role;
      } else {
        const roleResult = await RoleService.findByName("member");
        if (roleResult.success) {
          roleId = roleResult.data.id;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: sbError } = await (supabase as any)
        .from(this.table)
        .insert({
          email: params.email,
          name: params.name,
          password: params.password ?? null,
          role: roleId,
          active: true,
        })
        .select(this.fields.basic)
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
   * Uses the `basic` field set — password is NOT included.
   */
  static async getById(id: string): Promise<ServiceResult<Profile>> {
    try {
      const supabase = getSupabaseServerClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: sbError } = await (supabase as any)
        .from(this.table)
        .select(this.fields.basic)
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

  /**
   * Fetch a profile by email INCLUDING the password field.
   * ONLY for internal auth use — never expose via API.
   */
  static async getByEmailWithPassword(
    email: string,
  ): Promise<ServiceResult<Profile>> {
    try {
      const supabase = getSupabaseServerClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: sbError } = await (supabase as any)
        .from(this.table)
        .select(this.fields.with_password)
        .eq("email", email)
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

  /**
   * Count profiles that have a specific role ID.
   * Used by RoleService to check delete eligibility.
   */
  static async countByRole(roleId: string): Promise<ServiceResult<number>> {
    try {
      const supabase = getSupabaseServerClient();

      const { count, error: sbError } = await supabase
        .from(this.table)
        .select("id", { count: "exact", head: true })
        .eq("role", roleId);

      if (sbError) {
        return error(sbError.message);
      }

      return success(count || 0);
    } catch (err) {
      return error(
        (err as Error).message || "Failed to count profiles by role",
      );
    }
  }
}
