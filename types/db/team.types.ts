import { Profile } from './profile.types';
import { Project } from './project.types';

export type TeamRole = 'MANAGER' | 'MEMBER';

export interface Team {
  id: string;
  project: Partial<Project> | string;
  profile: Partial<Profile> | string;
  role: TeamRole;
  created_at?: string;
  updated_at?: string;
}
