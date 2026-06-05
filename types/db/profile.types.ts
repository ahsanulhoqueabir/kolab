import { Role } from "./role.types";

export interface Profile {
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

export interface ProfileFormData extends Omit<
  Profile,
  "id" | "created_at" | "updated_at" | "role" | "password"
> {
  password?: string;
  confirmPassword?: string;
  role: string;
}
