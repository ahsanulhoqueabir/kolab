"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Skeleton } from "@/components/core/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/core/ui/card";
import { toast } from "sonner";
import { UserForm } from "@/components/hr/users/UserForm";
import { useUserStore } from "@/store/user.store";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { ProfileFormData } from "@/types/db/profile.types";

function EditUserPageContent() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const { getUserById, updateUser } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<ProfileFormData | undefined>(
    undefined,
  );

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        const result = await getUserById(userId);

        if (result.success && result.data) {
          const user = result.data;
          setInitialData({
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            image: user.image || "",
            role:
              typeof user.role === "string" ? user.role : user.role?.id || "",
            active: user.active ?? true,
          });
        } else {
          toast.error(result.message || "Failed to load user");
          router.push("/users");
        }
      } catch {
        toast.error("Failed to load user");
        router.push("/users");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [getUserById, router, userId]);

  const handleUpdateUser = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const updateData: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        image: data.image || null,
        role: data.role,
        active: data.active,
      };

      if (data.password) {
        updateData.password = data.password;
      }

      const result = await updateUser(userId, updateData);

      if (result.success) {
        toast.success("User updated successfully");
        router.push("/users");
      } else {
        toast.error(result.message || "Failed to update user");
      }
    } catch {
      toast.error("Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
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
    <UserForm
      mode="edit"
      initialData={initialData}
      isSubmitting={isSubmitting}
      onSubmit={handleUpdateUser}
    />
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
