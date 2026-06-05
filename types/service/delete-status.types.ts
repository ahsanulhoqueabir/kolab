export interface RoleDeleteMeta {
  total: number;
  statusCounts: {
    published: number;
    draft: number;
    archived: number;
  };
}
