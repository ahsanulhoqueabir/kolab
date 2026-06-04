import type { Role } from "./role.types";

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string | null;
  phone?: string | null;
  image?: string | null;
  role?: Partial<Role> | string | null;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  image: string | null;
  active: boolean;
  role: { id: string; name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserParams {
  name: string;
  email: string;
  password: string;
  role: string;
  image?: string;
}

export interface UpdateUserParams {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  active?: boolean;
  image?: string;
}
