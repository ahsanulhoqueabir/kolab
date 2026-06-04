"use client";

import { useEffect, useState } from "react";
import { Plus, User, Trash2 } from "lucide-react";
import { Badge } from "@/components/core/ui/badge";
import { ListPage } from "@/components/core/shared/list-page";
import { useUserStore } from "@/store/user.store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { ConfirmationDialog } from "@/components/core/shared/ConfirmationDialog";
import { UserListCard } from "@/components/hr/users/UserListCard";
import { useReturnUrl } from "@/hooks/use-return-url";
import type { ListPageConfig } from "@/components/core/shared/list-page";
import type { UserListItem } from "@/types/db/user.types";

const UsersPageContent = () => {
  const router = useRouter();
  const { withReturnUrl } = useReturnUrl("/users");

  const users = useUserStore((state) => state.users);
  const loading = useUserStore((state) => state.isLoading);
  const fetchUsers = useUserStore((state) => state.fetchUsers);
  const refetchUsers = useUserStore((state) => state.refetchUsers);
  const deleteUser = useUserStore((state) => state.deleteUser);

  // Confirmation dialog state
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string>("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleConfirmedDelete = async () => {
    if (pendingDeleteId === null) return;
    try {
      const result = await deleteUser(pendingDeleteId);
      if (result.success) {
        toast.success("User deleted successfully");
      } else {
        toast.error(result.message || "Failed to delete user");
      }
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleDeleteClick = async (id: string, name: string) => {
    setPendingDeleteId(id);
    setPendingDeleteName(name);
    setIsConfirmOpen(true);
  };

  const config: ListPageConfig<UserListItem> = {
    resource: "user",
    title: "User Management",
    description: "Manage system users and their roles",

    columns: [
      {
        key: "name",
        label: "Name",
        width: 25,
        sortable: true,
        searchable: true,
        render: (value, item) => (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <span className="font-medium block">{item.name}</span>
            </div>
          </div>
        ),
      },
      {
        key: "email",
        label: "Email",
        width: 25,
        searchable: true,
      },
      {
        key: "role",
        label: "Role",
        width: 15,
        render: (value, item) => {
          return item.role ? (
            <Badge variant="outline">{item.role.name}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        key: "active",
        label: "Status",
        width: 10,
        render: (value, item) => (
          <Badge variant={item.active ? "default" : "secondary"}>
            {item.active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        key: "created_at",
        label: "Created At",
        width: 15,
        sortable: true,
        render: (value) => {
          if (!value) return "—";
          return new Date(value as string).toLocaleDateString();
        },
      },
    ],

    search: {
      fields: ["name", "email"],
      placeholder: "Search by name or email...",
    },

    actions: {
      default: ["edit", "delete"],
      pageActions: [
        {
          label: "Create User",
          icon: Plus,
          variant: "default",
          onClick: () => router.push(withReturnUrl("/users/create")),
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
            onClick: (selectedIds) => {
              selectedIds.forEach((id) => {
                deleteUser(id);
              });
              toast.success("Selected users deleted");
            },
            confirmMessage:
              "Are you sure you want to delete the selected users?",
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
        await refetchUsers();
        toast.success("Users refreshed successfully");
      } catch {
        toast.error("Failed to refresh users");
      }
    },

    onEdit: (user) => {
      router.push(withReturnUrl(`/users/${user.id}/edit`));
    },

    onDelete: async (id: string) => {
      const user = users.find((u) => u.id === id);
      await handleDeleteClick(String(id), user?.name ?? "");
    },
  };

  return (
    <div className="">
      <ListPage
        data={users ?? []}
        loading={loading}
        error={null}
        config={config}
        mobileRender={(user) => (
          <UserListCard
            key={user.id}
            user={user}
            onEdit={() => router.push(withReturnUrl(`/users/${user.id}/edit`))}
            onDelete={() => handleDeleteClick(String(user.id), user.name)}
          />
        )}
      />

      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Delete User"
        subtitle={`Are you sure you want to delete "${pendingDeleteName}"? This action cannot be undone.`}
        onConfirm={handleConfirmedDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
};

export default function UsersPage() {
  return (
    <PageAccessGuard pageUrl="/users">
      <ProtectedRoute>
        <UsersPageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
