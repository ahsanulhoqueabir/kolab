"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserForm } from "@/components/hr/users/UserForm";
import { useUserStore } from "@/store/user.store";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { ProfileFormData } from "@/types/db/profile.types";

function CreateUserPageContent() {
  const router = useRouter();
  const { createUser } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateUser = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createUser({
        name: data.name,
        email: data.email,
        password: data.password!,
        role: data.role,
        phone: data.phone || undefined,
        image: data.image || undefined,
      });

      if (result.success) {
        toast.success("User created successfully");
        router.push("/users");
      } else {
        toast.error(result.message || "Failed to create user");
      }
    } catch {
      toast.error("Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UserForm
      mode="create"
      isSubmitting={isSubmitting}
      onSubmit={handleCreateUser}
    />
  );
}

export default function CreateUserPage() {
  return (
    <PageAccessGuard pageUrl="/users/create">
      <ProtectedRoute>
        <CreateUserPageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
