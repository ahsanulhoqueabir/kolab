"use client";

import { useEffect, useState } from "react";
import { Plus, Shield, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/core/ui/badge";
import { ListPage } from "@/components/core/shared/list-page";
import { useRoleStore } from "@/store/role.store";
import { useRouter } from "next/navigation";
import { RoleRes } from "@/types/db/role.types";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { ConfirmationDialog } from "@/components/core/shared/ConfirmationDialog";
import { EmployeeBlockedDeleteDialog } from "@/components/hr/EmployeeBlockedDeleteDialog";
import { RoleListCard } from "@/components/hr/roles/RoleListCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/core/ui/dialog";
import { Button } from "@/components/ui/button";
import { useReturnUrl } from "@/hooks/use-return-url";
import type { ListPageConfig } from "@/components/core/shared/list-page";
import type { RoleDeleteMeta } from "@/types/service/delete-status.types";

interface ProfileCounts {
  total: number;
  statusCounts: { published: number; draft: number; archived: number };
}

const RolesPageContent = () => {
  const router = useRouter();
  const { withReturnUrl } = useReturnUrl("/role-management");

  const roles = useRoleStore((state) => state.roles);
  const loadingRoles = useRoleStore((state) => state.isLoading);
  const fetchRoles = useRoleStore((state) => state.fetchRoles);
  const refetchRoles = useRoleStore((state) => state.refetchRoles);
  const deleteRole = useRoleStore((state) => state.deleteRole);
  const checkDeleteStatus = useRoleStore((state) => state.checkDeleteStatus);
  const bulkDeleteRoles = useRoleStore((state) => state.bulkDeleteRoles);

  // Confirmation dialog state
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string>("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Blocked delete dialog state
  const [blockedDeleteOpen, setBlockedDeleteOpen] = useState(false);
  const [blockedDeleteMeta, setBlockedDeleteMeta] =
    useState<RoleDeleteMeta | null>(null);

  // Profiles-in-use dialog state
  const [profilesData, setProfilesData] = useState<ProfileCounts | null>(null);
  const [isProfilesDialogOpen, setIsProfilesDialogOpen] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleConfirmedDelete = async () => {
    if (pendingDeleteId === null) return;
    try {
      const result = await deleteRole(pendingDeleteId);
      if (result.hasProfiles && result.profileCounts) {
        setProfilesData(result.profileCounts);
        setIsProfilesDialogOpen(true);
      } else if (result.success) {
        toast.success("Role deleted successfully");
      } else {
        toast.error(result.message || "Failed to delete role");
      }
    } catch {
      toast.error("Failed to delete role");
    } finally {
      setPendingDeleteId(null);
    }
  };

  // Handler for bulk delete
  const handleBulkDelete = async (ids: string[]) => {
    try {
      const result = await bulkDeleteRoles(ids);

      if (result.success && result.failedCount === 0) {
        toast.success("Role deleted successfully");
      } else if (result.deletedCount > 0) {
        toast.success(
          `Deleted ${result.deletedCount} roles. Failed to delete ${result.failedCount} roles.`,
        );
      }

      if (result.failedCount > 0 && result.deletedCount === 0) {
        toast.error("Failed to delete selected roles");
      }
    } catch {
      toast.error("Failed to delete role");
    }
  };

  // Configuration for ListPage
  const config: ListPageConfig<RoleRes> = {
    resource: "role",
    title: "Role Management",
    description: "Manage user roles and permissions",

    columns: [
      {
        key: "name",
        label: "Role Name",
        width: 40,
        sortable: true,
        searchable: true,
        className: "text-left justify-start",
        render: (value, item) => (
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{item.name}</span>
          </div>
        ),
      },
      {
        key: "permission",
        label: "Permissions",
        width: 30,
        render: (value, item) => {
          const permissionCount = item.permission?.length || 0;
          return (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{permissionCount} Permissions</Badge>
            </div>
          );
        },
      },
      {
        key: "page",
        label: "Pages",
        width: 20,
        render: (value, item) => {
          const pageCount = item.page?.length || 0;
          return (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{pageCount} Pages</Badge>
            </div>
          );
        },
      },
    ],

    search: {
      fields: ["name"],
      placeholder: "Search roles...",
    },

    actions: {
      default: ["edit", "delete"],
      pageActions: [
        {
          label: "Create Role",
          icon: Plus,
          variant: "default",
          onClick: () => router.push(withReturnUrl("/role-management/+")),
        },
      ],
      bulk: {
        enabled: true,
        position: "bottom",
        showClearButton: true,
        actions: [
          {
            label: "Delete",
            icon: Trash2,
            variant: "destructive",
            onClick: (selectedIds) => handleBulkDelete(selectedIds.map(String)),
            confirmMessage:
              "Are you sure you want to delete the selected roles?",
            requireSelection: true,
          },
        ],
      },
    },

    pagination: {
      pageSize: 10,
      pageSizeOptions: [5, 10, 20, 50],
      showPageSizeSelector: true,
      showQuickJumper: false,
    },

    onRefresh: async () => {
      try {
        await refetchRoles();
        toast.success("Roles refreshed successfully");
      } catch {
        toast.error("Failed to refresh roles");
      }
    },

    onEdit: (role) => {
      router.push(withReturnUrl(`/role-management/${role.id}`));
    },

    onDelete: async (id: string) => {
      const role = roles.find((r) => r.id === id);
      await handleDeleteClick(String(id), role?.name ?? "");
    },
  };

  const handleDeleteClick = async (id: string, name: string) => {
    try {
      const status = await checkDeleteStatus(id);
      if (!status.success) {
        toast.error(status.message || "Failed to check delete status");
        return;
      }

      if (status.canDelete) {
        setPendingDeleteId(id);
        setPendingDeleteName(name);
        setIsConfirmOpen(true);
      } else if (status.meta) {
        setBlockedDeleteMeta(status.meta as unknown as RoleDeleteMeta);
        setPendingDeleteName(name);
        setBlockedDeleteOpen(true);
      }
    } catch {
      toast.error("Failed to check delete status");
    }
  };

  return (
    <div className="">
      <ListPage
        data={roles ?? []}
        loading={loadingRoles}
        error={null}
        config={config}
        mobileRender={(role) => (
          <RoleListCard
            key={role.id}
            role={role}
            onEdit={() =>
              router.push(withReturnUrl(`/role-management/${role.id}`))
            }
            onDelete={() => handleDeleteClick(String(role.id), role.name)}
          />
        )}
      />

      {/* Single-delete confirmation dialog */}
      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Delete Role"
        subtitle="Are you sure you want to delete this role? This action cannot be undone."
        onConfirm={handleConfirmedDelete}
        onCancel={() => setPendingDeleteId(null)}
      />

      {blockedDeleteMeta && (
        <EmployeeBlockedDeleteDialog
          open={blockedDeleteOpen}
          onOpenChange={(open) => {
            setBlockedDeleteOpen(open);
            if (!open) setBlockedDeleteMeta(null);
          }}
          type="role"
          name={pendingDeleteName}
          meta={blockedDeleteMeta}
        />
      )}

      {/* Profiles-in-use alert dialog */}
      <Dialog
        open={isProfilesDialogOpen}
        onOpenChange={setIsProfilesDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-500" />
              Role in Use
            </DialogTitle>
            <DialogDescription>
              {`This role is currently assigned to ${profilesData?.total ?? 0} profiles and cannot be deleted.`}
            </DialogDescription>
          </DialogHeader>

          {profilesData && (
            <div className="space-y-2 rounded-md border p-4 text-sm">
              <p className="font-medium text-muted-foreground">
                Profile Status Breakdown
              </p>
              <div className="flex items-center justify-between">
                <span>Published</span>
                <Badge variant="secondary">
                  {profilesData.statusCounts.published}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Draft</span>
                <Badge variant="outline">
                  {profilesData.statusCounts.draft}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Archived</span>
                <Badge variant="outline">
                  {profilesData.statusCounts.archived}
                </Badge>
              </div>
              <div className="flex items-center justify-between border-t pt-2 font-medium">
                <span>Total Profiles</span>
                <Badge>{profilesData.total}</Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="default"
              onClick={() => setIsProfilesDialogOpen(false)}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function RolesPage() {
  return (
    <PageAccessGuard pageUrl="/role-management">
      <ProtectedRoute>
        <RolesPageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
