import { Profile } from './profile.types';

export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  deadline?: string | null;
  status: ProjectStatus;
  created_by?: Partial<Profile> | string | null;
  updated_by?: Partial<Profile> | string | null;
  attachment?: string[] | null;
  created_at?: string;
  updated_at?: string;
}
