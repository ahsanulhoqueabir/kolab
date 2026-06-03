import { Profile } from './profile.types';

export type LogAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface Logs {
  id: string;
  created_at?: string;
  description?: string | null;
  action: LogAction;
  table: string;
  row: string;
  actor?: Partial<Profile> | string | null;
}
