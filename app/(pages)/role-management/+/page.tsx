"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { Card, CardContent } from "@/components/core/ui/card";
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

function CreateRolePageContent() {
  const router = useRouter();
  const { createRole, refetchRoles } = useRoleStore();
  const { returnTo } = useReturnUrl("/role-management");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          name: data.name,
          enterprise: "", // placeholder/empty or custom logic
          landing_page: data.landing_page || undefined,
          permission: uniquePermissions.map((perm) => ({
            name: perm,
          })),
          page: uniquePages.map((url) => ({ url })),
        };

        const result = await createRole(roleData);

        if (result.success) {
          // Refetch roles to update the list
          await refetchRoles();

          toast.success("Role created successfully");

          if (saveReturn) {
            router.push(returnTo);
          } else {
            // Reset form for "Save & Stay"
            setValue("name", "");
            setValue("landing_page", "");
            setSelectedPermissions([]);
            setSelectedPages([]);
          }
        } else {
          toast.error(result.message || "Failed to create role");
        }
      } catch (error) {
        console.error("Role creation error:", error);
        toast.error("Failed to create role");
      } finally {
        setIsSubmitting(false);
      }
    },
    [createRole, refetchRoles, router, setValue, returnTo],
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

  return (
    <div className="">
      <CreatePageHeader
        resource="role"
        title="Create Role"
        description="Create a new role with specific page access and permissions"
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

export default function CreateRolePage() {
  return (
    <PageAccessGuard pageUrl="/role-management/+">
      <ProtectedRoute>
        <CreateRolePageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
