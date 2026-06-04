export interface Role {
  id: string;
  name: string;
  permissions?: { name: string }[] | null;
  pages?: { url: string }[] | null;
  landing_page?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RoleRes extends Omit<Role, "permissions" | "pages"> {
  permission?: { name: string }[] | null;
  page?: { url: string }[] | null;
}

export interface CreateRoleParams extends Omit<
  Role,
  "id" | "created_at" | "updated_at"
> {
  landing_page: string;
}
