import { getSupabaseServerClient } from "@/lib/api/supabase";
import { success, error } from "@/lib/api/api-response";
import { paginated } from "@/lib/pagination";
import { Role } from "@/types/db/role.types";
import { ProfileService } from "./profile.service";
import { dbTimestamp } from "@/lib/date.utils";
import type { PaginatedData } from "@/types/types";

type ServiceResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export class RoleService {
  private static collection = "role";

  static async create(
    data: Omit<Role, "id" | "created_at" | "updated_at">,
  ): Promise<ServiceResult<{ role: Role }>> {
    try {
      const supabase = getSupabaseServerClient();

      const { data: role, error: sbError } = await supabase
        .from(this.collection)
        .insert({
          name: data.name,
          landing_page: data.landing_page || null,
          permissions: data.permissions || [],
          pages: data.pages || [],
        })
        .select()
        .single();

      if (sbError || !role) {
        return error(sbError?.message || "Failed to create role");
      }

      return success({ role: role as Role });
    } catch (err) {
      return error((err as Error).message || "Failed to create role");
    }
  }

  static async createMany(
    data: Omit<Role, "id" | "created_at" | "updated_at">[],
  ): Promise<ServiceResult<{ roles: Role[] }>> {
    try {
      const supabase = getSupabaseServerClient();
      const insertData = data.map((item) => ({
        name: item.name,
        landing_page: item.landing_page || null,
        permissions: item.permissions || [],
        pages: item.pages || [],
      }));

      const { data: roles, error: sbError } = await supabase
        .from(this.collection)
        .insert(insertData)
        .select();

      if (sbError || !roles) {
        return error(sbError?.message || "Failed to create roles");
      }

      return roles
        ? success({ roles: roles as Role[] })
        : error("Failed to create roles");
    } catch (err) {
      return error((err as Error).message || "Failed to create roles");
    }
  }

  static async update(
    data: Partial<Role> & { id: string },
  ): Promise<ServiceResult<{ role: Role }>> {
    try {
      const supabase = getSupabaseServerClient();

      const { data: role, error: sbError } = await supabase
        .from(this.collection)
        .update({
          name: data.name,
          landing_page: data.landing_page || null,
          permissions: data.permissions,
          pages: data.pages,
          updated_at: dbTimestamp(),
        })
        .eq("id", data.id)
        .select()
        .single();

      if (sbError || !role) {
        return error(sbError?.message || "Failed to update role");
      }

      return success({ role: role as Role });
    } catch (err) {
      return error((err as Error).message || "Failed to update role");
    }
  }

  static async list(filters?: {
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ServiceResult<PaginatedData<Role>>> {
    try {
      const supabase = getSupabaseServerClient();
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 50;
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      const query = supabase
        .from(this.collection)
        .select("*", { count: "exact" });

      if (filters?.search) {
        query.ilike("name", `%${filters.search}%`);
      }

      const {
        data: roles,
        error: sbError,
        count,
      } = await query.order("name", { ascending: true }).range(start, end);

      if (sbError || !roles) {
        return error(sbError?.message || "Failed to fetch roles");
      }

      return success(paginated(roles as Role[], count || 0, page, pageSize));
    } catch (err) {
      return error((err as Error).message || "Failed to fetch roles");
    }
  }

  static async find(id: string): Promise<ServiceResult<{ role: Role }>> {
    try {
      const supabase = getSupabaseServerClient();

      const { data: role, error: sbError } = await supabase
        .from(this.collection)
        .select("*")
        .eq("id", id)
        .single();

      if (sbError || !role) {
        return error(sbError?.message || "Role not found");
      }

      return success({ role: role as Role });
    } catch (err) {
      return error((err as Error).message || "Failed to fetch role");
    }
  }

  /**
   * Find a role by its name (case-insensitive).
   * Used by ProfileService.create to resolve the default role.
   */
  static async findByName(name: string): Promise<ServiceResult<Role>> {
    try {
      const supabase = getSupabaseServerClient();

      const { data: roles, error: sbError } = await supabase
        .from(this.collection)
        .select("id")
        .ilike("name", name)
        .limit(1);

      if (sbError || !roles || roles.length === 0) {
        return error(sbError?.message || `Role "${name}" not found`);
      }

      return success(roles[0] as Role);
    } catch (err) {
      return error((err as Error).message || "Failed to find role by name");
    }
  }

  /**
   * Search roles by name (partial match). Returns max 10 results.
   */
  static async search(value: string): Promise<ServiceResult<Role[]>> {
    try {
      const supabase = getSupabaseServerClient();

      const { data, error: sbError } = await supabase
        .from(this.collection)
        .select("id, name, pages, permissions")
        .ilike("name", `%${value}%`)
        .order("name", { ascending: true })
        .limit(10);

      if (sbError) return error(sbError.message);
      return success((data || []) as unknown as Role[]);
    } catch (err) {
      return error((err as Error).message || "Failed to search roles");
    }
  }

  static async valid(id: string): Promise<ServiceResult<Role>> {
    try {
      const supabase = getSupabaseServerClient();

      const { data: role, error: sbError } = await supabase
        .from(this.collection)
        .select("id, name")
        .eq("id", id)
        .single();

      if (sbError || !role) {
        return error(sbError?.message || "Role not found");
      }

      return success(role as Role);
    } catch (err) {
      return error((err as Error).message || "Failed to validate role");
    }
  }

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
      return error((err as Error).message || "Failed to delete role");
    }
  }

  static async hasData(): Promise<ServiceResult<boolean>> {
    try {
      const supabase = getSupabaseServerClient();

      const { data, error: sbError } = await supabase
        .from(this.collection)
        .select("id")
        .limit(1);

      if (sbError || !data) {
        return error(sbError?.message || "Failed to check role data");
      }

      return success(data.length > 0);
    } catch (err) {
      return error((err as Error).message || "Failed to check role data");
    }
  }

  static async checkDeleteStatus(
    id: string,
  ): Promise<ServiceResult<{ canDelete: boolean; meta: { users: number } }>> {
    try {
      // Use ProfileService instead of querying profile table directly
      const countResult = await ProfileService.countByRole(id);

      if (!countResult.success) {
        return error(countResult.error);
      }

      const totalCount = countResult.data;

      return success({
        canDelete: totalCount === 0,
        meta: { users: totalCount },
      });
    } catch (err) {
      return error((err as Error).message || "Failed to check delete status");
    }
  }

  static async hasPermission(
    roleId: string,
    permission: string,
  ): Promise<ServiceResult<boolean>> {
    try {
      const supabase = getSupabaseServerClient();

      const { data: role, error: sbError } = await supabase
        .from(this.collection)
        .select("permissions")
        .eq("id", roleId)
        .single();

      if (sbError || !role) {
        return error(sbError?.message || "Role not found");
      }

      const permissions = (role.permissions || []) as { name: string }[];
      const hasPerm = permissions.some((p) => p.name === permission);

      return success(hasPerm);
    } catch (err) {
      return error((err as Error).message || "Failed to check permission");
    }
  }
}
