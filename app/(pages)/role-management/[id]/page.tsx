"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader } from "@/components/core/ui/card";
import { Input } from "@/components/core/ui/input";
import { Label } from "@/components/core/ui/label";
import { Badge } from "@/components/core/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/core/ui/tabs";
import { PermissionTable } from "@/components/hr/roles/PermissionTable";
import { PagePermissionSelector } from "@/components/hr/roles/PagePermissionSelector";
import { Skeleton } from "@/components/core/ui/skeleton";
import { toast } from "sonner";
import { CreatePageHeader } from "@/components/core/shared/CreatePageHeader";
import { useRoleStore } from "@/store/role.store";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { useReturnUrl } from "@/hooks/use-return-url";
import {
  deduplicatePermissions,
  deduplicatePages,
} from "@/lib/business/permission";

interface RoleFormData {
  name: string;
  landing_page: string;
}

function EditRolePageContent() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;

  const { updateRole, getRoleById, refetchRoles } = useRoleStore();
  const { returnTo } = useReturnUrl("/role-management");

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<RoleFormData>({
    defaultValues: {
      name: "",
      landing_page: "",
    },
  });

  const landingPage = useWatch({ control, name: "landing_page" });
  const roleName = useWatch({ control, name: "name" });
  const canSubmitRole = (roleName ?? "").trim().length > 0;

  const selectedPermissionsRef = useRef(selectedPermissions);
  const selectedPagesRef = useRef(selectedPages);

  // Keep refs in sync with state (inside effect to avoid ref access during render)
  useEffect(() => {
    selectedPermissionsRef.current = selectedPermissions;
    selectedPagesRef.current = selectedPages;
  }, [selectedPermissions, selectedPages]);

  // Load role data
  useEffect(() => {
    const loadRole = async () => {
      try {
        setIsLoading(true);
        const result = await getRoleById(roleId);

        if (result.success && result.data) {
          const role = result.data;
          setValue("name", role.name);
          setValue("landing_page", role.landing_page || "");

          // Set permissions
          if (role.permission && Array.isArray(role.permission)) {
            const permissions = role.permission.map((p) =>
              typeof p === "object" ? p.name : p,
            );
            setSelectedPermissions(permissions);
          }

          // Set pages
          if (role.page && Array.isArray(role.page)) {
            const pages = role.page.map((p) =>
              typeof p === "object" ? p.url : p,
            );
            setSelectedPages(pages);
          }
        } else {
          toast.error(result.message || "Failed to load role");
          router.push(returnTo);
        }
      } catch (error) {
        console.error("Error loading role:", error);
        toast.error("Failed to load role");
        router.push(returnTo);
      } finally {
        setIsLoading(false);
      }
    };

    loadRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId]);

  const performFormSubmit = useCallback(
    async (data: RoleFormData, saveReturn: boolean) => {
      if (selectedPermissionsRef.current.length === 0) {
        toast.error("Please select at least one permission");
        return;
      }

      setIsSubmitting(true);
      try {
        // Deduplicate permissions and pages before sending to API
        const uniquePermissions = deduplicatePermissions(
          selectedPermissionsRef.current,
        );
        const uniquePages = deduplicatePages(selectedPagesRef.current);

        const roleData = {
          id: roleId,
          name: data.name,
          enterprise: "", // placeholder/empty or custom logic
          landing_page: data.landing_page || undefined,
          permission: uniquePermissions.map((perm) => ({
            name: perm,
          })),
          page: uniquePages.map((url) => ({ url })),
        };

        const result = await updateRole(roleData);

        if (result.success) {
          // Refetch roles to update the list
          await refetchRoles();

          toast.success("Role updated successfully");

          if (saveReturn) {
            router.push(returnTo);
          }
        } else {
          toast.error(result.message || "Failed to update role");
        }
      } catch (error) {
        console.error("Role update error:", error);
        toast.error("Failed to update role");
      } finally {
        setIsSubmitting(false);
      }
    },
    [roleId, updateRole, refetchRoles, router, returnTo],
  );

  const handleDiscard = useCallback(() => {
    router.push(returnTo);
  }, [returnTo, router]);

  const handleSaveAndReturn = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSubmit((data: RoleFormData) => performFormSubmit(data, true))();
    },
    [handleSubmit, performFormSubmit],
  );

  const handleSave = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSubmit((data: RoleFormData) => performFormSubmit(data, false))();
    },
    [handleSubmit, performFormSubmit],
  );

  const handleFormSubmitDefault = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      handleSubmit((data: RoleFormData) => performFormSubmit(data, false))();
    },
    [handleSubmit, performFormSubmit],
  );

  const handlePermissionUnselectBlocked = useCallback(
    (blocked: { permission: string; requiredByPages: string[] }[]) => {
      if (blocked.length === 0) return;

      const description = blocked
        .map(
          ({ permission, requiredByPages }) =>
            `${permission} (${requiredByPages.join(", ") || "selected pages"})`,
        )
        .join("; ");

      toast.warning("This permission is required by selected pages.", {
        description,
      });
    },
    [],
  );

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
    <div className="">
      <CreatePageHeader
        resource="role"
        title="Edit Role"
        description="Modify role name, landing page, page access, and resource permissions"
        onDiscard={handleDiscard}
        onSaveAndReturn={handleSaveAndReturn}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        disabled={!canSubmitRole}
      />

      <form
        id="role-form"
        onSubmit={handleFormSubmitDefault}
        className="space-y-6 mb-10"
      >
        {/* Section 1 — Basic Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Role Name
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name", {
                    required: "Role name is required",
                    minLength: {
                      value: 2,
                      message: "Role name must be at least 2 characters",
                    },
                  })}
                  placeholder="Enter role name"
                  className={errors.name ? "border-destructive" : ""}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="landing_page">Landing Page</Label>
                <Select
                  value={landingPage || ""}
                  onValueChange={(value) => setValue("landing_page", value)}
                  disabled={isSubmitting || selectedPages.length === 0}
                >
                  <SelectTrigger id="landing_page" className="h-9">
                    <SelectValue placeholder="Select a landing page" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedPages.map((page) => (
                      <SelectItem key={page} value={page}>
                        {page}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPages.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Select pages first to enable landing page selection
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2 — Main Tabs: Permission List | Page List */}
        <Tabs defaultValue="permissions">
          <TabsList className="w-full h-11">
            <TabsTrigger
              value="permissions"
              className="flex-1 gap-2 h-10 py-1 items-center"
            >
              Permissions
              {selectedPermissions.length > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {selectedPermissions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="pages"
              className="flex-1 gap-2 h-10 py-1 items-center"
            >
              Pages
              {selectedPages.length > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {selectedPages.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="permissions" className="mt-4">
            <PermissionTable
              selectedPermissions={selectedPermissions}
              selectedPages={selectedPages}
              onPermissionsChange={setSelectedPermissions}
              onPermissionUnselectBlocked={handlePermissionUnselectBlocked}
              disabled={isSubmitting}
            />
          </TabsContent>

          <TabsContent value="pages" className="mt-4">
            <PagePermissionSelector
              selectedPages={selectedPages}
              onPagesChange={setSelectedPages}
              onPermissionsChange={setSelectedPermissions}
              disabled={isSubmitting}
            />
          </TabsContent>
        </Tabs>
      </form>
    </div>
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
