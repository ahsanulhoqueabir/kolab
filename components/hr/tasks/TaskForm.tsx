"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/core/ui/card";
import { Input } from "@/components/core/ui/input";
import { Label } from "@/components/core/ui/label";
import { Button } from "@/components/ui/button";
import { CreatePageHeader } from "@/components/core/shared/CreatePageHeader";
import { useReturnUrl } from "@/hooks/use-return-url";
import { SearchComboBox } from "@/components/core/shared/SearchComboBox";
import { DatePicker } from "@/components/core/ui/date-picker";
import { FileUpload } from "@/components/core/shared/FileUpload";
import { useAuthStore } from "@/store/auth.store";
import { useUploadStore } from "@/store/upload.store";
import {
  TASK_DEFAULT_VALUES,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  TASK_VALIDATION_RULES,
} from "@/schema/task.schema";
import type {
  CreateTaskParams,
  TaskPriority,
  TaskStatus,
} from "@/types/db/task.types";

export type TaskFormMode = "create" | "edit";

interface TaskFormProps {
  mode: TaskFormMode;
  initialData?: CreateTaskParams;
  isSubmitting: boolean;
  onSubmit: (data: CreateTaskParams) => Promise<void>;
  projects: { id: string; name: string }[];
  users: { id: string; name: string }[];
}

export function TaskForm({
  mode,
  initialData,
  isSubmitting,
  onSubmit,
  projects,
  users,
}: TaskFormProps) {
  const router = useRouter();
  const { returnTo } = useReturnUrl("/tasks");
  const isEdit = mode === "edit";
  const queuedFiles = useUploadStore((s) => s.queuedFiles);
  const isUploading = useUploadStore((s) => s.isUploading);
  const uploadAndGetUrls = useUploadStore((s) => s.uploadAndGetUrls);
  const clearUploadFiles = useUploadStore((s) => s.clearFiles);
  const busy = isSubmitting || isUploading;

  const { permissions } = useAuthStore();
  const canCreateProject = permissions.includes("project:create");
  const canCreateUser = permissions.includes("user:create");

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateTaskParams>({
    defaultValues: TASK_DEFAULT_VALUES,
  });

  const formTitle = useWatch({ control, name: "title" });
  const selectedProject = useWatch({ control, name: "project" });
  const selectedPriority = useWatch({ control, name: "priority" });
  const selectedStatus = useWatch({ control, name: "status" });
  const selectedAssignee = useWatch({ control, name: "assigned_to" });
  const canSubmit = !!(formTitle && selectedProject);

  const projectOptions = useMemo(() => {
    return (projects || []).map((p) => ({ value: p.id, label: p.name }));
  }, [projects]);

  const userOptions = useMemo(() => {
    return (users || []).map((u) => ({ value: u.id, label: u.name }));
  }, [users]);

  const priorityOptions = useMemo(() => {
    return PRIORITY_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }));
  }, []);

  const statusOptions = useMemo(() => {
    return STATUS_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }));
  }, []);

  const dueDateValue = useWatch({ control, name: "due_date" });
  const attachmentValue = useWatch({ control, name: "attachment" });
  const dueDate = useMemo(() => {
    if (!dueDateValue) return undefined;
    const d = new Date(dueDateValue);
    return isNaN(d.getTime()) ? undefined : d;
  }, [dueDateValue]);

  const handleDueDateChange = (date: Date | undefined) => {
    setValue("due_date", date ? date.toISOString().split("T")[0] : "", {
      shouldDirty: true,
    });
  };

  const handleAttachmentChange = (urls: string[]) => {
    setValue("attachment", urls, { shouldDirty: true });
  };

  useEffect(() => {
    if (initialData) {
      setValue("title", initialData.title);
      setValue("description", initialData.description || "");
      setValue("project", initialData.project);
      setValue("assigned_to", initialData.assigned_to || "");
      setValue("due_date", initialData.due_date || "");
      setValue("priority", initialData.priority);
      setValue("status", initialData.status || "TODO");
      setValue("attachment", initialData.attachment || []);
    }
  }, [initialData, setValue]);

  const handleFormSubmit = async (data: CreateTaskParams) => {
    // Upload queued files via signed URLs
    let uploadedUrls: string[] = [];
    if (queuedFiles.length > 0) {
      uploadedUrls = await uploadAndGetUrls("tasks");
    }

    const allAttachments = [
      ...(data.attachment || []),
      ...uploadedUrls,
    ];

    clearUploadFiles();

    await onSubmit({
      title: data.title,
      description: data.description || undefined,
      project: data.project,
      assigned_to: data.assigned_to || undefined,
      due_date: data.due_date || undefined,
      priority: data.priority,
      status: data.status,
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
        resource="task"
        title={isEdit ? "Edit Task" : "Create Task"}
        description={
          isEdit
            ? "Update task details, assignment, and status"
            : "Create a new task under a project"
        }
        onDiscard={handleDiscard}
        onSaveAndReturn={handleSaveAndReturn}
        onSave={handleSave}
        isSubmitting={busy}
        disabled={!canSubmit || busy}
      />

      <form
        id="task-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6 mb-10"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">
                  Title <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="title"
                  {...register("title", TASK_VALIDATION_RULES.title)}
                  placeholder="Enter task title"
                  className={errors.title ? "border-destructive" : ""}
                  disabled={busy}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  {...register("description")}
                  placeholder="Enter task description"
                  className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={busy}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">
                  Project <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <SearchComboBox
                      options={projectOptions}
                      value={selectedProject || ""}
                      onValueChange={(value) => setValue("project", value)}
                      placeholder="Select a project"
                      searchPlaceholder="Search projects..."
                      emptyMessage="No projects found."
                      disabled={busy}
                      showCreate={canCreateProject}
                      createLabel="Create new project"
                      onCreateNew={() => router.push("/projects/create")}
                    />
                  </div>
                  {canCreateProject && (
                    <Button
                      type="button"
                      size="icon-sm"
                      onClick={() => router.push("/projects/create")}
                      title="Create new project"
                      disabled={busy}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assign To</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <SearchComboBox
                      options={userOptions}
                      value={selectedAssignee || ""}
                      onValueChange={(value) => setValue("assigned_to", value)}
                      placeholder="Select a member"
                      searchPlaceholder="Search members..."
                      emptyMessage="No members found."
                      disabled={busy}
                      showCreate={canCreateUser}
                      createLabel="Create new user"
                      onCreateNew={() => router.push("/users/create")}
                    />
                  </div>
                  {canCreateUser && (
                    <Button
                      type="button"
                      size="icon-sm"
                      onClick={() => router.push("/users/create")}
                      title="Create new user"
                      disabled={busy}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <SearchComboBox
                  options={priorityOptions}
                  value={selectedPriority || "MEDIUM"}
                  onValueChange={(value) =>
                    setValue("priority", value as TaskPriority)
                  }
                  placeholder="Select priority"
                  searchPlaceholder="Search priority..."
                  emptyMessage="No priority options."
                  disabled={busy}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <DatePicker
                  id="due_date"
                  date={dueDate}
                  onDateChange={handleDueDateChange}
                  placeholder="Select due date"
                  disabled={busy}
                  disablePastDates
                  yearRange={{
                    from: new Date().getFullYear(),
                    to: new Date().getFullYear() + 5,
                  }}
                />
              </div>

              {isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <SearchComboBox
                    options={statusOptions}
                    value={selectedStatus || "TODO"}
                    onValueChange={(value) =>
                      setValue("status", value as TaskStatus)
                    }
                    placeholder="Select status"
                    searchPlaceholder="Search status..."
                    emptyMessage="No status options."
                    disabled={busy}
                  />
                </div>
              )}

              {/* Attachments — full width */}
              <div className="space-y-2 md:col-span-2">
                <Label>Attachments</Label>
                <FileUpload
                  value={attachmentValue || []}
                  onChange={handleAttachmentChange}
                  disabled={busy}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
