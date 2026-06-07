"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  User,
  Camera,
  X,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Shield,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/core/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/core/ui/dialog";
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
import { useSessionStore } from "@/store/session.store";
import { useUploadStore } from "@/store/upload.store";
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
  const uploadAndGetUrls = useUploadStore((s) => s.uploadAndGetUrls);
  const isUploading = useUploadStore((s) => s.isUploading);
  const uploadProgress = useUploadStore((s) => s.uploadProgress);
  const { returnTo } = useReturnUrl("/profile");
  const [resetPassword, setResetPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    sessions,
    isLoading: loadingSessions,
    isProcessing: sessionProcessing,
    error: sessionError,
    fetchSessions,
    revokeSession,
    revokeAllOtherSessions,
  } = useSessionStore();

  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);
  const [confirmRevokeAllOthers, setConfirmRevokeAllOthers] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Show toast on session errors
  useEffect(() => {
    if (sessionError) {
      toast.error(sessionError);
    }
  }, [sessionError]);

  const handleRevokeSession = (sessionId: string) => {
    setSessionToRevoke(sessionId);
  };

  const executeRevokeSession = async (sessionId: string) => {
    await revokeSession(sessionId);
    if (!useSessionStore.getState().error) {
      toast.success("Session revoked successfully");
    }
    setSessionToRevoke(null);
  };

  const handleRevokeAllOthers = () => {
    setConfirmRevokeAllOthers(true);
  };

  const executeRevokeAllOthers = async () => {
    await revokeAllOtherSessions();
    if (!useSessionStore.getState().error) {
      toast.success("All other sessions revoked successfully");
    }
    setConfirmRevokeAllOthers(false);
  };

  const busy = isProcessing || isUploading || sessionProcessing;

  /**
   * Derive image preview:
   * 1. Newly selected file → local preview
   * 2. Existing image from server → use as-is
   * 3. Remove requested → null (show fallback)
   */
  const imagePreview = removeImage
    ? null
    : (localPreview ?? user?.image ?? null);

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

    setRemoveImage(false);
    setSelectedFile(file);
    setLocalPreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setLocalPreview(null);
    setRemoveImage(true);
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

    // Image: upload via signed URL → public URL, or empty to remove
    if (selectedFile) {
      const uploaded = await uploadAndGetUrls("profiles");
      if (uploaded.length > 0) {
        updateData.image = uploaded[0];
      }
    } else if (removeImage) {
      updateData.image = "";
    }

    if (resetPassword && data.password) {
      updateData.password = data.password;
    }

    const result = await updateProfile(updateData as Record<string, string>);

    if (result.success) {
      toast.success("Profile updated successfully");
      setSelectedFile(null);
      setLocalPreview(null);
      setRemoveImage(false);
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
                  disabled={busy}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  {isUploading
                    ? `Uploading… ${uploadProgress}%`
                    : imagePreview
                      ? "Change Image"
                      : "Upload Image"}
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
                  disabled={busy}
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
                  disabled={busy}
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
                  disabled={busy}
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
                        disabled={busy}
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
                        disabled={busy}
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
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      {/* ── Active Sessions ───────────────────────────────────── */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Active Sessions
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage your active sessions on other devices
            </p>
          </div>
          {sessions.length > 1 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRevokeAllOthers}
              disabled={busy}
            >
              <ShieldAlert className="h-4 w-4 mr-2" />
              Revoke All Others
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loadingSessions ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active sessions found.
            </p>
          ) : (
            <div className="divide-y divide-border border-t border-border mt-2">
              {sessions.map((session) => {
                const isCurrent = session.id === user?.currentSessionId;
                const DeviceIcon =
                  session.device_type === "mobile"
                    ? Smartphone
                    : session.device_type === "tablet"
                      ? Tablet
                      : Monitor;

                // Format location details if available
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const loc = session.ip_location as any;
                const locationStr =
                  loc && (loc.city || loc.country)
                    ? `${loc.city || ""}${loc.city && loc.country ? ", " : ""}${loc.country || ""}`
                    : null;

                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                        <DeviceIcon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {session.browser_name || "Unknown Browser"}{" "}
                            {session.browser_version || ""} on{" "}
                            {session.os_name || "Unknown OS"}{" "}
                            {session.os_version || ""}
                          </span>
                          {isCurrent && (
                            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                              Current Session
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {session.ip_address || "Unknown IP"}
                            {locationStr && ` (${locationStr})`}
                          </span>
                          <span className="text-muted-foreground/60">•</span>
                          <span>
                            Started:{" "}
                            {new Date(session.created_at).toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </div>
                    {!isCurrent && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={busy}
                        title="Revoke session"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Confirm Revoke Single Session Modal ────────────────── */}
      <Dialog
        open={sessionToRevoke !== null}
        onOpenChange={(open) => !open && setSessionToRevoke(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Revoke Active Session
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this active session? The
              associated device will be immediately signed out of the
              application.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setSessionToRevoke(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              type="button"
              onClick={() => {
                if (sessionToRevoke) {
                  executeRevokeSession(sessionToRevoke);
                }
              }}
              disabled={busy}
            >
              Revoke Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Revoke All Other Sessions Modal ────────────── */}
      <Dialog
        open={confirmRevokeAllOthers}
        onOpenChange={setConfirmRevokeAllOthers}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Revoke All Other Sessions
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke all other active sessions? All
              other devices will be signed out immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setConfirmRevokeAllOthers(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              type="button"
              onClick={() => {
                executeRevokeAllOthers();
              }}
              disabled={busy}
            >
              Revoke All Other Sessions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
