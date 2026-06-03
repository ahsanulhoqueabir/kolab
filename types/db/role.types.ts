export interface Role {
  id: string;
  name: string;
  permissions?: { name: string }[] | null;
  pages?: { url: string }[] | null;
  landing_page?: string | null;
  created_at?: string;
  updated_at?: string;
}
