import { Profile } from "./profile.types";
import { Project } from "./project.types";

export type TeamRole = "MANAGER" | "MEMBER";

export interface Team {
  id: string;
  project: Partial<Project> | string;
  profile: Partial<Profile> | string;
  role: TeamRole;
  created_at?: string;
  updated_at?: string;
}

export interface TeamMember {
  id: string;
  project: { id: string; name: string } | string;
  profile:
    | { id: string; name: string; email: string; image?: string | null }
    | string;
  role: TeamRole;
  created_at: string;
}

export interface AddMemberParams {
  project: string;
  profile: string;
  role?: TeamRole;
}

export interface WorkloadItem {
  profile_id: string;
  profile_name: string;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
}
