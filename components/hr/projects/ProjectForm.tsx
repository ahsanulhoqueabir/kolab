"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { Card, CardContent } from "@/components/core/ui/card";
import { Input } from "@/components/core/ui/input";
import { Label } from "@/components/core/ui/label";
import { SearchComboBox } from "@/components/core/shared/SearchComboBox";
import { DatePicker } from "@/components/core/ui/date-picker";
import { FileUpload } from "@/components/core/shared/FileUpload";
import { CreatePageHeader } from "@/components/core/shared/CreatePageHeader";
import { useReturnUrl } from "@/hooks/use-return-url";
import { useUploadStore } from "@/store/upload.store";
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
  const queuedFiles = useUploadStore((s) => s.queuedFiles);
  const clearUploadFiles = useUploadStore((s) => s.clearFiles);

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
  const deadlineValue = useWatch({ control, name: "deadline" });
  const attachmentValue = useWatch({ control, name: "attachment" });
  const canSubmit = !!formName;

  // Convert string date ↔ Date for the DatePicker
  const deadlineDate = useMemo(() => {
    if (!deadlineValue) return undefined;
    const d = new Date(deadlineValue);
    return isNaN(d.getTime()) ? undefined : d;
  }, [deadlineValue]);

  const handleDeadlineChange = (date: Date | undefined) => {
    setValue("deadline", date ? date.toISOString().split("T")[0] : "", {
      shouldDirty: true,
    });
  };

  const handleAttachmentChange = (urls: string[]) => {
    setValue("attachment", urls, { shouldDirty: true });
  };

  useEffect(() => {
    if (initialData) {
      setValue("name", initialData.name);
      setValue("description", initialData.description || "");
      setValue("deadline", initialData.deadline || "");
      setValue("status", (initialData.status || "DRAFT") as ProjectStatus);
      setValue("attachment", initialData.attachment || []);
    }
  }, [initialData, setValue]);

  // ── Merge queued base64 files into attachment, then submit ────────
  const handleFormSubmit = async (data: CreateProjectParams) => {
    // Merge existing URLs + queued base64 files
    const allAttachments = [
      ...(data.attachment || []),
      ...queuedFiles.map((qf) => qf.base64),
    ];

    clearUploadFiles();

    await onSubmit({
      name: data.name,
      description: data.description || undefined,
      deadline: data.deadline || undefined,
      status: data.status as ProjectStatus,
      attachment: allAttachments.length > 0 ? allAttachments : undefined,
    });
  };

  const handleDiscard = () => {
    clearUploadFiles();
    router.push(returnTo);
  };

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
                <SearchComboBox
                  options={PROJECT_STATUS_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  value={selectedStatus || "DRAFT"}
                  onValueChange={(value) =>
                    setValue("status", value as ProjectStatus)
                  }
                  placeholder="Select status"
                  searchPlaceholder="Search status..."
                  emptyMessage="No status options found."
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <DatePicker
                  id="deadline"
                  date={deadlineDate}
                  onDateChange={handleDeadlineChange}
                  placeholder="Select deadline"
                  disabled={isSubmitting}
                  disablePastDates
                  yearRange={{
                    from: new Date().getFullYear(),
                    to: new Date().getFullYear() + 5,
                  }}
                />
              </div>

              {/* Attachments — full width */}
              <div className="space-y-2 md:col-span-2">
                <Label>Attachments</Label>
                <FileUpload
                  value={attachmentValue || []}
                  onChange={handleAttachmentChange}
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
