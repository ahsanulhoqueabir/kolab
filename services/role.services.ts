import { getSupabaseServerClient } from "@/lib/api/supabase";
import { success, error } from "@/lib/api/api-response";
import { Role } from "@/types/db/role.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceResult<T = any> =
  | { success: true; data: T }
  | { success: false; error: string };

export class RoleService {
  private static collection = "role";

  static async create(
    data: Omit<Role, "id" | "created_at" | "updated_at">,
  ): Promise<ServiceResult<{ role: Role }>> {
    try {
      const supabase = getSupabaseServerClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: role, error: sbError } = await (supabase as any)
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: roles, error: sbError } = await (supabase as any)
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: role, error: sbError } = await (supabase as any)
        .from(this.collection)
        .update({
          name: data.name,
          landing_page: data.landing_page || null,
          permissions: data.permissions,
          pages: data.pages,
          updated_at: new Date().toISOString(),
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

  static async list(): Promise<ServiceResult<{ roles: Role[] }>> {
    try {
      const supabase = getSupabaseServerClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: roles, error: sbError } = await (supabase as any)
        .from(this.collection)
        .select("*")
        .order("name", { ascending: true });

      if (sbError || !roles) {
        return error(sbError?.message || "Failed to fetch roles");
      }

      return success({ roles: roles as Role[] });
    } catch (err) {
      return error((err as Error).message || "Failed to fetch roles");
    }
  }

  static async find(id: string): Promise<ServiceResult<{ role: Role }>> {
    try {
      const supabase = getSupabaseServerClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: role, error: sbError } = await (supabase as any)
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

  static async valid(id: string): Promise<ServiceResult<Role>> {
    try {
      const supabase = getSupabaseServerClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: role, error: sbError } = await (supabase as any)
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: sbError } = await (supabase as any)
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: sbError } = await (supabase as any)
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
      const supabase = getSupabaseServerClient();

      // Count profiles with this role
      const { count, error: sbError } = await supabase
        .from("profile")
        .select("id", { count: "exact", head: true })
        .eq("role", id);

      if (sbError) {
        return error(sbError.message);
      }

      const totalCount = count || 0;

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: role, error: sbError } = await (supabase as any)
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
