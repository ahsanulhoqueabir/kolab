import { Role } from './role.types';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  image?: string | null;
  role?: Partial<Role> | string | null;
  created_at?: string;
  updated_at?: string;
}
