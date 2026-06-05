import { getSupabaseServerClient } from "@/lib/api/supabase";
import { success, error } from "@/lib/api/api-response";
import { hashPassword } from "@/lib/api/argon2.helper";
import { paginated } from "@/lib/pagination";
import { dbTimestamp } from "@/lib/date.utils";
import type {
  User,
  UserListItem,
  CreateUserParams,
  UpdateUserParams,
} from "@/types/db/user.types";
import type { PaginatedData } from "@/types/types";

type ServiceResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export class UserService {
  private static collection = "profile";

  /**
   * List all profiles with pagination, search, and role filter.
   * Returns minimal fields for list view.
   */
  static async list(filters?: {
    search?: string;
    role?: string;
    active?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<ServiceResult<PaginatedData<UserListItem>>> {
    try {
      const supabase = getSupabaseServerClient();
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 50;
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      const query = supabase
        .from(this.collection)
        .select(
          "id, name, email, image, active, role (id, name), created_at, updated_at",
          { count: "exact" },
        );

      if (filters?.search) {
        const s = filters.search;
        query.or(`name.ilike.%${s}%,email.ilike.%${s}%`);
      }

      if (filters?.role) {
        query.eq("role", filters.role);
      }

      if (filters?.active !== undefined) {
        query.eq("active", filters.active);
      }

      const {
        data,
        error: sbError,
        count,
      } = await query
        .order("created_at", { ascending: false })
        .range(start, end);

      if (sbError) {
        return error(sbError.message);
      }

      return success(
        paginated(
          (data || []) as unknown as UserListItem[],
          count || 0,
          page,
          pageSize,
        ),
      );
    } catch (err) {
      return error((err as Error).message || "Failed to fetch users");
    }
  }

  /**
   * Create a new profile with hashed password and role assignment.
   */
  static async create(params: CreateUserParams): Promise<ServiceResult<User>> {
    try {
      const supabase = getSupabaseServerClient();
      const hashedPassword = await hashPassword(params.password);

      const { data, error: sbError } = await supabase
        .from(this.collection)
        .insert({
          id: crypto.randomUUID(),
          name: params.name,
          email: params.email,
          password: hashedPassword,
          role: params.role,
          image: params.image || null,
          active: true,
        })
        .select()
        .single();

      if (sbError) {
        return error(sbError.message);
      }

      return success(data as User);
    } catch (err) {
      return error((err as Error).message || "Failed to create user");
    }
  }

  /**
   * Find a single profile by ID with role details.
   */
  static async find(id: string): Promise<ServiceResult<User>> {
    try {
      const supabase = getSupabaseServerClient();

      const { data, error: sbError } = await supabase
        .from(this.collection)
        .select("*, role (id, name)")
        .eq("id", id)
        .single();

      if (sbError || !data) {
        return error(sbError?.message || "User not found");
      }

      return success(data as User);
    } catch (err) {
      return error((err as Error).message || "Failed to fetch user");
    }
  }

  /**
   * Update profile fields. If password is provided, it will be hashed.
   */
  static async update(
    id: string,
    params: UpdateUserParams,
  ): Promise<ServiceResult<User>> {
    try {
      const supabase = getSupabaseServerClient();
      const updateData: Record<string, unknown> = {};

      if (params.name !== undefined) updateData.name = params.name;
      if (params.email !== undefined) updateData.email = params.email;
      if (params.role !== undefined) updateData.role = params.role;
      if (params.active !== undefined) updateData.active = params.active;
      if (params.image !== undefined) updateData.image = params.image;

      if (params.password) {
        updateData.password = await hashPassword(params.password);
      }

      updateData.updated_at = dbTimestamp();

      const { data, error: sbError } = await supabase
        .from(this.collection)
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (sbError || !data) {
        return error(sbError?.message || "Failed to update user");
      }

      return success(data as User);
    } catch (err) {
      return error((err as Error).message || "Failed to update user");
    }
  }

  /**
   * Delete a profile by ID.
   */
  static async delete(id: string): Promise<ServiceResult<undefined>> {
    try {
      const supabase = getSupabaseServerClient();

      const { error: sbError } = await supabase
        .from(this.collection)
        .delete()
        .eq("id", id);

      if (sbError) {
        return error(sbError.message);
      }

      return success(undefined);
    } catch (err) {
      return error((err as Error).message || "Failed to delete user");
    }
  }

  /**
   * Minimal existence check — returns the user if found.
   */
  static async valid(
    id: string,
  ): Promise<ServiceResult<{ id: string; name: string }>> {
    try {
      const supabase = getSupabaseServerClient();

      const { data, error: sbError } = await supabase
        .from(this.collection)
        .select("id, name")
        .eq("id", id)
        .single();

      if (sbError || !data) {
        return error(sbError?.message || "User not found");
      }

      return success(data as { id: string; name: string });
    } catch (err) {
      return error((err as Error).message || "Failed to validate user");
    }
  }

  /**
   * Check if a profile can be deleted (no associated records).
   */
  static async checkDeleteStatus(
    id: string,
  ): Promise<
    ServiceResult<{ canDelete: boolean; meta?: { message: string } }>
  > {
    try {
      const supabase = getSupabaseServerClient();

      // Check if user has created projects
      const { data: projects, error: projError } = await supabase
        .from("project")
        .select("id")
        .eq("created_by", id)
        .limit(1);

      if (projError) {
        return error(projError.message);
      }

      if (projects && projects.length > 0) {
        return success({
          canDelete: false,
          meta: {
            message: "User has associated projects and cannot be deleted.",
          },
        });
      }

      // Check if user has assigned tasks
      const { data: tasks, error: taskError } = await supabase
        .from("task")
        .select("id")
        .eq("assigned_to", id)
        .limit(1);

      if (taskError) {
        return error(taskError.message);
      }

      if (tasks && tasks.length > 0) {
        return success({
          canDelete: false,
          meta: { message: "User has assigned tasks and cannot be deleted." },
        });
      }

      return success({ canDelete: true });
    } catch (err) {
      return error((err as Error).message || "Failed to check delete status");
    }
  }
}
