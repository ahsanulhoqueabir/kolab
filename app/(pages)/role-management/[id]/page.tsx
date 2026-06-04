"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/core/ui/card";
import { Skeleton } from "@/components/core/ui/skeleton";
import { toast } from "sonner";
import { RoleForm } from "@/components/hr/roles/RoleForm";
import { useRoleStore } from "@/store/role.store";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import type { RoleFormSubmitData } from "@/components/hr/roles/RoleForm";

function EditRolePageContent() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;

  const { updateRole, getRoleById, refetchRoles } = useRoleStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<
    | {
        name: string;
        landing_page?: string | null;
        permissions: string[];
        pages: string[];
      }
    | undefined
  >(undefined);

  // Load role data
  useEffect(() => {
    const loadRole = async () => {
      try {
        setIsLoading(true);
        const result = await getRoleById(roleId);

        if (result.success && result.data) {
          const role = result.data;
          const permissions = (role.permission || []).map((p) =>
            typeof p === "object" ? p.name : p,
          );
          const pages = (role.page || []).map((p) =>
            typeof p === "object" ? p.url : p,
          );

          setInitialData({
            name: role.name,
            landing_page: role.landing_page,
            permissions,
            pages,
          });
        } else {
          toast.error(result.message || "Failed to load role");
          router.push("/role-management");
        }
      } catch (error) {
        console.error("Error loading role:", error);
        toast.error("Failed to load role");
        router.push("/role-management");
      } finally {
        setIsLoading(false);
      }
    };

    loadRole();
  }, [roleId, getRoleById, router]);

  const handleUpdateRole = async (data: RoleFormSubmitData) => {
    setIsSubmitting(true);
    try {
      const result = await updateRole({
        id: roleId,
        name: data.name,
        landing_page: data.landing_page,
        permission: data.permission,
        page: data.page,
      });

      if (result.success) {
        await refetchRoles();
        toast.success("Role updated successfully");
        router.push("/role-management");
      } else {
        toast.error(result.message || "Failed to update role");
      }
    } catch (error) {
      console.error("Role update error:", error);
      toast.error("Failed to update role");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="">
        {/* Header skeleton */}
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:justify-between md:items-start">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column skeleton */}
          <div className="space-y-6">
            {/* Basic Info Card skeleton */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-36" />
                </div>
                <Skeleton className="h-4 w-56 mt-1" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Permissions Grid Card skeleton */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-4 w-52" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Table header */}
                <div className="grid grid-cols-5 gap-2 mb-2">
                  <Skeleton className="h-4 w-full" />
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
                {/* Table rows */}
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 items-center">
                    <Skeleton className="h-4 w-3/4" />
                    {[...Array(4)].map((_, j) => (
                      <Skeleton key={j} className="h-5 w-5 rounded mx-auto" />
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right column skeleton */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded" />
                      <Skeleton className="h-5 w-36" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  return (
    <RoleForm
      mode="edit"
      initialData={initialData}
      isSubmitting={isSubmitting}
      onSubmit={handleUpdateRole}
    />
  );
}

export default function EditRolePage() {
  return (
    <PageAccessGuard pageUrl="/role-management/[id]">
      <ProtectedRoute>
        <EditRolePageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
