"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { Plus, Upload, X, Loader2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/core/ui/card";
import { Input } from "@/components/core/ui/input";
import { Label } from "@/components/core/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/core/ui/checkbox";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/core/ui/avatar";
import { CreatePageHeader } from "@/components/core/shared/CreatePageHeader";
import { SearchComboBox } from "@/components/core/shared/SearchComboBox";
import { useRoleStore } from "@/store/role.store";
import type { RoleRes } from "@/types/db/role.types";
import { useAuthStore } from "@/store/auth.store";
import { useReturnUrl } from "@/hooks/use-return-url";
import type { ProfileFormData } from "@/types/db/profile.types";
import {
  PROFILE_VALIDATION_RULES,
  PROFILE_DEFAULT_VALUES,
} from "@/schema/profile.schema";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/** Convert a File to a base64 data-URI string */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

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
  const { items: roles, fetchRoles } = useRoleStore();
  const { permissions } = useAuthStore();
  const { returnTo } = useReturnUrl("/users");
  const [resetPassword, setResetPassword] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    () => initialData?.image || null,
  );
  const imageBase64Ref = useRef<string>("");

  const isEdit = mode === "edit";

  const defaultValues = isEdit
    ? {
        name: "",
        email: "",
        password: "",
        role: "",
        confirmPassword: "",
        phone: "",
        image: "",
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

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      setIsImageUploading(true);
      try {
        const base64 = await fileToBase64(file);
        imageBase64Ref.current = base64;
        setValue("image", base64);
        setImagePreview(URL.createObjectURL(file));
      } catch {
        toast.error("Failed to process image");
      } finally {
        setIsImageUploading(false);
      }
    },
    [setValue],
  );

  const handleImageRemove = useCallback(() => {
    setValue("image", "");
    setImagePreview(null);
    imageBase64Ref.current = "";
  }, [setValue]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (initialData) {
      setValue("name", initialData.name);
      setValue("email", initialData.email);
      if (initialData.phone) setValue("phone", initialData.phone);
      if (initialData.image) setValue("image", initialData.image);
      if (initialData.role) setValue("role", initialData.role);
      if (initialData.active !== undefined)
        setValue("active", initialData.active);
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
      phone: data.phone || "",
      image: data.image || "",
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="border-b pb-3 mb-4">
                  <h3 className="text-base font-semibold text-foreground">
                    Basic Information
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    General identity and system role configuration.
                  </p>
                </div>

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
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...register("phone", PROFILE_VALIDATION_RULES.phone)}
                    placeholder="Enter phone number"
                    className={errors.phone ? "border-destructive" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Role with search combobox + create button */}
                <div className="space-y-2">
                  <Label htmlFor="role">
                    Role{" "}
                    {!isEdit && <span className="text-red-500 ml-1">*</span>}
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

                {/* Profile Image */}
                <div className="space-y-3">
                  <Label>Profile Image</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      {imagePreview ? (
                        <AvatarImage src={imagePreview} alt="Profile" />
                      ) : (
                        <AvatarFallback>
                          <User className="h-6 w-6 text-muted-foreground" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="space-y-2">
                      {imagePreview ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleImageRemove}
                          disabled={isSubmitting || isImageUploading}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      ) : (
                        <div className="relative">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isSubmitting || isImageUploading}
                            onClick={() =>
                              document
                                .getElementById("profile-image-input")
                                ?.click()
                            }
                          >
                            {isImageUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-1" />
                                Upload Image
                              </>
                            )}
                          </Button>
                          <input
                            id="profile-image-input"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isSubmitting || isImageUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file);
                              e.target.value = "";
                            }}
                          />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG or WEBP (max 5MB)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Account & Security Settings */}
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-3">
                <div className="border-b pb-3">
                  <h3 className="text-base font-semibold text-foreground">
                    Account & Security
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Manage account access status and credentials.
                  </p>
                </div>

                {/* Account Status (edit mode only) */}
                {isEdit && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Account Status
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Active Card */}
                      <div
                        onClick={() =>
                          !isSubmitting && setValue("active", true)
                        }
                        className={cn(
                          "flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-all duration-200 select-none",
                          isActive
                            ? "border-primary bg-primary/5 shadow-xs"
                            : "border-border hover:border-muted-foreground/30",
                        )}
                      >
                        <div className="space-y-0.5">
                          <span className="text-sm font-medium">Active</span>
                        </div>
                        <div
                          className={cn(
                            "h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                            isActive
                              ? "border-primary bg-primary"
                              : "border-muted-foreground",
                          )}
                        >
                          {isActive && (
                            <div className="h-1.5 w-1.5 rounded-full bg-background" />
                          )}
                        </div>
                      </div>

                      {/* Inactive Card */}
                      <div
                        onClick={() =>
                          !isSubmitting && setValue("active", false)
                        }
                        className={cn(
                          "flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-all duration-200 select-none",
                          !isActive
                            ? "border-primary bg-primary/5 shadow-xs"
                            : "border-border hover:border-muted-foreground/30",
                        )}
                      >
                        <div className="space-y-0.5">
                          <span className="text-sm font-medium">Inactive</span>
                        </div>
                        <div
                          className={cn(
                            "h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                            !isActive
                              ? "border-primary bg-primary"
                              : "border-muted-foreground",
                          )}
                        >
                          {!isActive && (
                            <div className="h-1.5 w-1.5 rounded-full bg-background" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Password */}
                <div className="space-y-3 pt-3 border-t">
                  <Label htmlFor="password" className="text-sm font-semibold">
                    {isEdit ? "Password Update" : "Password Configuration"}
                    {!isEdit && <span className="text-red-500 ml-1">*</span>}
                  </Label>

                  {isEdit ? (
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Checkbox
                          checked={resetPassword}
                          onCheckedChange={(checked) => {
                            const isChecked = checked === true;
                            setResetPassword(isChecked);
                            if (!isChecked) {
                              setValue("password", "");
                              setValue("confirmPassword", "");
                            }
                          }}
                          disabled={isSubmitting}
                        />
                        <span className="text-xs text-muted-foreground">
                          Check to change user password
                        </span>
                      </label>

                      <AnimatePresence initial={false}>
                        {resetPassword && (
                          <motion.div
                            key="password-fields"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden space-y-3"
                          >
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
                                  errors.confirmPassword
                                    ? "border-destructive"
                                    : ""
                                }
                                disabled={isSubmitting}
                              />
                              {errors.confirmPassword && (
                                <p className="text-sm text-destructive">
                                  {errors.confirmPassword.message}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="space-y-2">
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
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
