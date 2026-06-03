export interface Profile {
  id: string;
  user: string;
  email: string;
  name: string;
  username: string | null;
  role: string;
  created_at?: string;
  updated_at?: string;
}
