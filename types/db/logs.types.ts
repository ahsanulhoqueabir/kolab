import { Profile } from "./profile.types";

export type LogAction = "CREATE" | "UPDATE" | "DELETE";

export interface Logs {
  id: string;
  created_at?: string;
  description?: string | null;
  action: LogAction;
  table: string;
  row: string;
  actor?: Partial<Profile> | string | null;
}

export interface LogListItem {
  id: string;
  description: string;
  action: LogAction;
  table: string;
  row: string;
  actor?: { id: string; name: string } | string | null;
  created_at: string;
}

export interface CreateLogParams {
  actor: string;
  table: string;
  row: string;
  action: LogAction;
  description: string;
}
