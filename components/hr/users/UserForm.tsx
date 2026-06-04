"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/core/ui/card";
import { Input } from "@/components/core/ui/input";
import { Label } from "@/components/core/ui/label";
import { Badge } from "@/components/core/ui/badge";
import { Button } from "@/components/ui/button";
import { CreatePageHeader } from "@/components/core/shared/CreatePageHeader";
import { SearchComboBox } from "@/components/core/shared/SearchComboBox";
import { useRoleStore, type RoleRes } from "@/store/role.store";
import { useAuthStore } from "@/store/auth.store";
import { useReturnUrl } from "@/hooks/use-return-url";
import type { ProfileFormData } from "@/types/db/profile.types";
import {
  PROFILE_VALIDATION_RULES,
  PROFILE_DEFAULT_VALUES,
} from "@/schema/profile.schema";
import { cn } from "@/lib/utils";

export type UserFormMode = "create" | "edit";

interface UserFormProps {
  mode: UserFormMode;
  initialData?: ProfileFormData;
  isSubmitting: boolean;
  onSubmit: (data: ProfileFormData) => Promise<void>;
}

export function UserForm({
  mode,
  initialData,
  isSubmitting,
  onSubmit,
}: UserFormProps) {
  const router = useRouter();
  const { roles, fetchRoles } = useRoleStore();
  const { permissions } = useAuthStore();
  const { returnTo } = useReturnUrl("/users");
  const [resetPassword, setResetPassword] = useState(false);

  const isEdit = mode === "edit";

  const defaultValues = isEdit
    ? {
        name: "",
        email: "",
        password: "",
        role: "",
        confirmPassword: "",
        active: true,
      }
    : { ...PROFILE_DEFAULT_VALUES, active: undefined };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    getValues,
    formState: { errors },
  } = useForm<ProfileFormData & { active?: boolean }>({
    defaultValues,
  });

  const selectedRole = useWatch({ control, name: "role" });
  const formName = useWatch({ control, name: "name" });
  const formEmail = useWatch({ control, name: "email" });
  const isActive = useWatch({ control, name: "active" });
  const formPassword = useWatch({ control, name: "password" });

  const canSubmit = !!(
    formName &&
    formEmail &&
    (isEdit || selectedRole) &&
    (isEdit ? true : formPassword)
  );

  const canCreateRole = permissions.includes("role:create");

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (initialData) {
      setValue("name", initialData.name);
      setValue("email", initialData.email);
      if (initialData.role) {
        setValue("role", initialData.role);
      }
      if (initialData.active !== undefined) {
        setValue("active", initialData.active);
      }
    }
  }, [initialData, setValue]);

  const roleOptions = (roles || []).map((role: RoleRes) => ({
    value: role.id,
    label: role.name,
  }));

  const handleFormSubmit = async (
    data: ProfileFormData & { active?: boolean },
  ) => {
    const submitData: ProfileFormData = {
      name: data.name,
      email: data.email,
      role: data.role,
    };

    if (isEdit) {
      if (resetPassword && data.password) {
        submitData.password = data.password;
      }
      submitData.active = data.active;
    } else {
      submitData.password = data.password ?? undefined;
    }

    await onSubmit(submitData);
  };

  const handleDiscard = () => router.push(returnTo);

  const handleSaveAndReturn = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(handleFormSubmit)();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(handleFormSubmit)();
  };

  return (
    <div>
      <CreatePageHeader
        resource="user"
        title={isEdit ? "Edit User" : "Create User"}
        description={
          isEdit
            ? "Modify user details, role, and account status"
            : "Create a new system user with role assignment"
        }
        onDiscard={handleDiscard}
        onSaveAndReturn={handleSaveAndReturn}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        disabled={!canSubmit}
      />

      <form
        id="user-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6 mb-10"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name", PROFILE_VALIDATION_RULES.name)}
                  placeholder="Enter full name"
                  className={errors.name ? "border-destructive" : ""}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email", PROFILE_VALIDATION_RULES.email)}
                  placeholder="Enter email address"
                  className={errors.email ? "border-destructive" : ""}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Role with search combobox + create button */}
              <div className="space-y-2">
                <Label htmlFor="role">
                  Role {!isEdit && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <SearchComboBox
                      options={roleOptions}
                      value={selectedRole || ""}
                      onValueChange={(value) => setValue("role", value)}
                      placeholder="Select a role"
                      searchPlaceholder="Search roles..."
                      emptyMessage="No roles found."
                      disabled={isSubmitting}
                      showCreate={canCreateRole}
                      createLabel="Create new role"
                      onCreateNew={() => router.push("/role-management/+")}
                    />
                  </div>
                  {canCreateRole && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => router.push("/role-management/+")}
                      title="Create new role"
                      disabled={isSubmitting}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Account Status (edit mode only) */}
              {isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="active">Account Status</Label>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("active")}
                        className="rounded border-gray-300 focus:ring-primary h-4 w-4 text-primary"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm">
                        {isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Password */}
              <div
                className={cn(
                  "space-y-2",
                  isEdit ? "md:col-span-2" : "md:col-span-2",
                )}
              >
                <Label htmlFor="password">
                  {isEdit ? "Reset Password" : "Password"}
                  {!isEdit && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {isEdit ? (
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={resetPassword}
                        onChange={(e) => {
                          setResetPassword(e.target.checked);
                          if (!e.target.checked) {
                            setValue("password", "");
                            setValue("confirmPassword", "");
                          }
                        }}
                        className="rounded border-gray-300 focus:ring-primary h-4 w-4 text-primary"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm text-muted-foreground">
                        Check to set a new password
                      </span>
                    </label>
                    {resetPassword && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Input
                            id="password"
                            type="password"
                            {...register(
                              "password",
                              PROFILE_VALIDATION_RULES.password,
                            )}
                            placeholder="Enter new password"
                            className={
                              errors.password ? "border-destructive" : ""
                            }
                            disabled={isSubmitting}
                          />
                          {errors.password && (
                            <p className="text-sm text-destructive">
                              {errors.password.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Input
                            id="confirmPassword"
                            type="password"
                            {...register("confirmPassword", {
                              validate: (value) =>
                                !resetPassword ||
                                value === getValues("password") ||
                                "Passwords do not match",
                            })}
                            placeholder="Confirm new password"
                            className={
                              errors.confirmPassword ? "border-destructive" : ""
                            }
                            disabled={isSubmitting}
                          />
                          {errors.confirmPassword && (
                            <p className="text-sm text-destructive">
                              {errors.confirmPassword.message}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Input
                      id="password"
                      type="password"
                      {...register(
                        "password",
                        PROFILE_VALIDATION_RULES.password,
                      )}
                      placeholder="Enter password"
                      className={errors.password ? "border-destructive" : ""}
                      disabled={isSubmitting}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">
                        {errors.password.message}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
