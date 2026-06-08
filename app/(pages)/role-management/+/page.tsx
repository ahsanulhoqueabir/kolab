"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RoleForm } from "@/components/hr/roles/RoleForm";
import { useRoleStore } from "@/store/role.store";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import type { RoleFormSubmitData } from "@/components/hr/roles/RoleForm";

function CreateRolePageContent() {
  const router = useRouter();
  const { createRole, refetchRoles } = useRoleStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateRole = async (data: RoleFormSubmitData) => {
    setIsSubmitting(true);
    try {
      const result = await createRole({
        name: data.name,
        landing_page: data.landing_page,
        permissions: data.permissions,
        pages: data.pages,
      });

      if (result.success) {
        await refetchRoles();
        toast.success("Role created successfully");
        router.push("/role-management");
      } else {
        toast.error(result.message || "Failed to create role");
      }
    } catch (error) {
      console.error("Role creation error:", error);
      toast.error("Failed to create role");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleForm
      mode="create"
      isSubmitting={isSubmitting}
      onSubmit={handleCreateRole}
    />
  );
}

export default function CreateRolePage() {
  return (
    <PageAccessGuard pageUrl="/role-management/+">
      <ProtectedRoute>
        <CreateRolePageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
