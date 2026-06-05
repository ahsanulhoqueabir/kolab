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
import { CreatePageHeader } from "@/components/core/shared/CreatePageHeader";
import { useReturnUrl } from "@/hooks/use-return-url";
import {
  deduplicatePermissions,
  deduplicatePages,
} from "@/lib/business/permission";
import type { CreateRoleParams } from "@/types/db/role.types";
import {
  ROLE_DEFAULT_VALUES,
  ROLE_VALIDATION_RULES,
} from "@/schema/role.schema";
import { toast } from "sonner";

export type RoleFormMode = "create" | "edit";

interface RoleFormInitialData {
  name: string;
  landing_page?: string | null;
  permissions: string[];
  pages: string[];
}

export interface RoleFormSubmitData {
  name: string;
  landing_page?: string;
  permission: { name: string }[];
  page: { url: string }[];
}

interface RoleFormProps {
  mode: RoleFormMode;
  initialData?: RoleFormInitialData;
  isSubmitting: boolean;
  onSubmit: (data: RoleFormSubmitData) => Promise<void>;
}

export function RoleForm({
  mode,
  initialData,
  isSubmitting,
  onSubmit,
}: RoleFormProps) {
  const router = useRouter();
  const { returnTo } = useReturnUrl("/role-management");
  const isEdit = mode === "edit";

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    () => initialData?.permissions ?? [],
  );
  const [selectedPages, setSelectedPages] = useState<string[]>(
    () => initialData?.pages ?? [],
  );

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateRoleParams>({
    defaultValues: initialData
      ? { name: initialData.name, landing_page: initialData.landing_page || "" }
      : ROLE_DEFAULT_VALUES,
  });

  const landingPage = useWatch({ control, name: "landing_page" });
  const roleName = useWatch({ control, name: "name" });
  const canSubmit = (roleName ?? "").trim().length > 0;

  const selectedPermissionsRef = useRef(selectedPermissions);
  const selectedPagesRef = useRef(selectedPages);

  useEffect(() => {
    selectedPermissionsRef.current = selectedPermissions;
    selectedPagesRef.current = selectedPages;
  }, [selectedPermissions, selectedPages]);

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

  const handleDiscard = () => router.push(returnTo);

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit((data: CreateRoleParams) => {
      const perms = selectedPermissionsRef.current;
      const pgs = selectedPagesRef.current;

      if (perms.length === 0) {
        toast.error("Please select at least one permission");
        return;
      }

      const uniquePermissions = deduplicatePermissions(perms);
      const uniquePages = deduplicatePages(pgs);

      onSubmit({
        name: data.name,
        landing_page: data.landing_page || undefined,
        permission: uniquePermissions.map((perm) => ({ name: perm })),
        page: uniquePages.map((url) => ({ url })),
      });
    })();
  };

  const handleSaveAndReturn = onFormSubmit;
  const handleSave = onFormSubmit;

  return (
    <div>
      <CreatePageHeader
        resource="role"
        title={isEdit ? "Edit Role" : "Create Role"}
        description={
          isEdit
            ? "Modify role name, landing page, page access, and resource permissions"
            : "Create a new role with specific page access and permissions"
        }
        onDiscard={handleDiscard}
        onSaveAndReturn={handleSaveAndReturn}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        disabled={!canSubmit}
      />

      <form id="role-form" onSubmit={onFormSubmit} className="space-y-6 mb-10">
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
                  {...register("name", ROLE_VALIDATION_RULES.name)}
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
