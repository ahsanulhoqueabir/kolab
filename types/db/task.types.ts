import { Profile } from './profile.types';
import { Project } from './project.types';

export type TaskPriority = 'HIGH' | 'LOW' | 'MEDIUM';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  assigned_to?: Partial<Profile> | string | null;
  due_date?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  project: Partial<Project> | string;
  attachment?: string[] | null;
  comment?: string | null;
  created_by?: Partial<Profile> | string | null;
  updated_by?: Partial<Profile> | string | null;
  created_at?: string;
  updated_at?: string;
}
