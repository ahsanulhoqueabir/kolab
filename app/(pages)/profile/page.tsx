"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { User, Camera, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/core/ui/card";
import { Input } from "@/components/core/ui/input";
import { Label } from "@/components/core/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/core/ui/checkbox";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/core/ui/avatar";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { useAuthStore } from "@/store/auth.store";
import { useProfileStore } from "@/store/profile.store";
import { useReturnUrl } from "@/hooks/use-return-url";
import {
  PROFILE_DEFAULT_VALUES,
  PROFILE_VALIDATION_RULES,
} from "@/schema/profile.schema";
import type { ProfileFormData } from "@/types/db/profile.types";

function ProfilePageContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { updateProfile, isProcessing } = useProfileStore();
  const { returnTo } = useReturnUrl("/profile");
  const [resetPassword, setResetPassword] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive image preview: prefer newly selected base64, fall back to existing user image
  const imagePreview = imageBase64 ?? user?.image ?? null;

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: PROFILE_DEFAULT_VALUES,
  });

  // Prefill form from auth store user (populated by /auth/me on load)
  useEffect(() => {
    if (user) {
      setValue("name", user.name || "");
      setValue("email", user.email || "");
      setValue("phone", user.phone || "");
    }
  }, [user, setValue]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageBase64(result);
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageBase64(""); // empty string signals "remove image"
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    // Password confirmation check
    if (resetPassword && data.password) {
      if (data.password !== data.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    const updateData: Record<string, string | undefined> = {
      name: data.name,
      phone: data.phone || undefined,
    };

    // Image: send base64 if newly selected, or empty string to remove
    if (imageBase64) {
      updateData.image = imageBase64;
    } else if (imageBase64 === "" && user?.image) {
      // User explicitly removed the image
      updateData.image = "";
    }

    if (resetPassword && data.password) {
      updateData.password = data.password;
    }

    const result = await updateProfile(updateData as Record<string, string>);

    if (result.success) {
      toast.success("Profile updated successfully");
      setImageBase64(null);
      setResetPassword(false);
    } else {
      toast.error(result.message || "Failed to update profile");
    }
  };

  const getNameInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6" />
          Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal information and password
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Profile Image ───────────────────────────────────── */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Profile Image</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={imagePreview || ""}
                    alt={getValues("name") || "Profile"}
                  />
                  <AvatarFallback className="text-2xl">
                    {getValues("name")
                      ? getNameInitials(getValues("name"))
                      : "U"}
                  </AvatarFallback>
                </Avatar>

                {/* Remove image button */}
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow hover:bg-destructive/90 transition-colors"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {imagePreview ? "Change Image" : "Upload Image"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG or WEBP. Max 2MB.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Personal Information ────────────────────────────── */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Personal Information</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...register("name", PROFILE_VALIDATION_RULES.name)}
                  className={errors.name ? "border-destructive" : ""}
                  disabled={isProcessing}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register("phone", PROFILE_VALIDATION_RULES.phone)}
                  className={errors.phone ? "border-destructive" : ""}
                  disabled={isProcessing}
                  placeholder="+8801XXXXXXXXX"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Password ────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Password</h2>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={resetPassword}
                  onCheckedChange={(checked) =>
                    setResetPassword(checked === true)
                  }
                  disabled={isProcessing}
                />
                <span className="text-sm text-muted-foreground">
                  Change password
                </span>
              </label>
            </div>
          </CardHeader>
          <AnimatePresence initial={false}>
            {resetPassword && (
              <motion.div
                key="password-fields"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">New Password</Label>
                      <Input
                        id="password"
                        type="password"
                        {...register(
                          "password",
                          PROFILE_VALIDATION_RULES.password,
                        )}
                        className={errors.password ? "border-destructive" : ""}
                        disabled={isProcessing}
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...register("confirmPassword", {
                          validate: (value) =>
                            !resetPassword ||
                            value === getValues("password") ||
                            "Passwords do not match",
                        })}
                        className={
                          errors.confirmPassword ? "border-destructive" : ""
                        }
                        disabled={isProcessing}
                      />
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* ── Actions ─────────────────────────────────────────── */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(returnTo)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <PageAccessGuard pageUrl="/profile">
      <ProtectedRoute>
        <ProfilePageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
