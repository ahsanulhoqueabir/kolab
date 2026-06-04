"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { Card, CardContent } from "@/components/core/ui/card";
import { Input } from "@/components/core/ui/input";
import { Label } from "@/components/core/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";
import { CreatePageHeader } from "@/components/core/shared/CreatePageHeader";
import { useReturnUrl } from "@/hooks/use-return-url";
import {
  PROJECT_DEFAULT_VALUES,
  PROJECT_STATUS_OPTIONS,
  PROJECT_VALIDATION_RULES,
} from "@/schema/project.schema";
import type {
  CreateProjectParams,
  ProjectStatus,
} from "@/types/db/project.types";

export type ProjectFormMode = "create" | "edit";

interface ProjectFormProps {
  mode: ProjectFormMode;
  initialData?: CreateProjectParams;
  isSubmitting: boolean;
  onSubmit: (data: CreateProjectParams) => Promise<void>;
}

export function ProjectForm({
  mode,
  initialData,
  isSubmitting,
  onSubmit,
}: ProjectFormProps) {
  const router = useRouter();
  const { returnTo } = useReturnUrl("/projects");
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateProjectParams>({
    defaultValues: PROJECT_DEFAULT_VALUES,
  });

  const formName = useWatch({ control, name: "name" });
  const selectedStatus = useWatch({ control, name: "status" });
  const canSubmit = !!formName;

  useEffect(() => {
    if (initialData) {
      setValue("name", initialData.name);
      setValue("description", initialData.description || "");
      setValue("deadline", initialData.deadline || "");
      setValue("status", (initialData.status || "DRAFT") as ProjectStatus);
    }
  }, [initialData, setValue]);

  const handleFormSubmit = async (data: CreateProjectParams) => {
    await onSubmit({
      name: data.name,
      description: data.description || undefined,
      deadline: data.deadline || undefined,
      status: data.status as ProjectStatus,
    });
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
        resource="project"
        title={isEdit ? "Edit Project" : "Create Project"}
        description={
          isEdit
            ? "Update project details and status"
            : "Create a new project to organize your tasks"
        }
        onDiscard={handleDiscard}
        onSaveAndReturn={handleSaveAndReturn}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        disabled={!canSubmit}
      />

      <form
        id="project-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6 mb-10"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">
                  Project Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name", PROJECT_VALIDATION_RULES.name)}
                  placeholder="Enter project name"
                  className={errors.name ? "border-destructive" : ""}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  {...register("description")}
                  placeholder="Enter project description"
                  className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={selectedStatus || "DRAFT"}
                  onValueChange={(value) =>
                    setValue("status", value as ProjectStatus)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="status" className="h-9">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  {...register("deadline")}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
