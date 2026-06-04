"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader } from "@/components/core/ui/card";
import { Input } from "@/components/core/ui/input";
import { Label } from "@/components/core/ui/label";
import { Badge } from "@/components/core/ui/badge";
import { Skeleton } from "@/components/core/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";
import { toast } from "sonner";
import { CreatePageHeader } from "@/components/core/shared/CreatePageHeader";
import { useUserStore } from "@/store/user.store";
import { useRoleStore } from "@/store/role.store";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { useReturnUrl } from "@/hooks/use-return-url";
import type { RoleRes } from "@/store/role.store";

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
  active: boolean;
}

function EditUserPageContent() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const { getUserById, updateUser } = useUserStore();
  const { roles, fetchRoles } = useRoleStore();
  const { returnTo } = useReturnUrl("/users");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [resetPassword, setResetPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "",
      active: true,
    },
  });

  const selectedRole = watch("role");
  const formName = watch("name");
  const formEmail = watch("email");
  const isActive = watch("active");
  const canSubmit = !!(formName && formEmail);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        const result = await getUserById(userId);

        if (result.success && result.data) {
          const user = result.data;
          setValue("name", user.name);
          setValue("email", user.email);
          setValue("active", user.active ?? true);
          if (user.role?.id) {
            setValue("role", user.role.id);
          }
        } else {
          toast.error(result.message || "Failed to load user");
          router.push(returnTo);
        }
      } catch {
        toast.error("Failed to load user");
        router.push(returnTo);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [userId, getUserById, setValue, router, returnTo]);

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      const updateData: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        role: data.role,
        active: data.active,
      };

      if (resetPassword && data.password) {
        updateData.password = data.password;
      }

      const result = await updateUser(userId, updateData);

      if (result.success) {
        toast.success("User updated successfully");
        router.push(returnTo);
      } else {
        toast.error(result.message || "Failed to update user");
      }
    } catch {
      toast.error("Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => router.push(returnTo);

  const handleSaveAndReturn = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(onSubmit)();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(onSubmit)();
  };

  if (isLoading) {
    return (
      <div className="">
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

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="">
      <CreatePageHeader
        resource="user"
        title="Edit User"
        description="Modify user details, role, and account status"
        onDiscard={handleDiscard}
        onSaveAndReturn={handleSaveAndReturn}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        disabled={!canSubmit}
      />

      <form
        id="user-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 mb-10"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name", {
                    required: "Name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                  })}
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

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Invalid email address",
                    },
                  })}
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

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={selectedRole || ""}
                  onValueChange={(value) => setValue("role", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="role" className="h-9">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {(roles || []).map((role: RoleRes) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-3">
                  <Label htmlFor="password">Reset Password</Label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={resetPassword}
                      onChange={(e) => setResetPassword(e.target.checked)}
                      className="rounded border-gray-300 focus:ring-primary h-4 w-4 text-primary"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm text-muted-foreground">
                      Check to set a new password
                    </span>
                  </label>
                </div>
                {resetPassword && (
                  <Input
                    id="password"
                    type="password"
                    {...register("password", {
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    placeholder="Enter new password"
                    className={errors.password ? "border-destructive" : ""}
                    disabled={isSubmitting}
                  />
                )}
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

export default function EditUserPage() {
  return (
    <PageAccessGuard pageUrl="/users/[id]/edit">
      <ProtectedRoute>
        <EditUserPageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
