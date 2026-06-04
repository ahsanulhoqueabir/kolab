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

  useEffect(() => {
    if (initialData) {
      setValue("title", initialData.title);
      setValue("description", initialData.description || "");
      setValue("project", initialData.project);
      setValue("assigned_to", initialData.assigned_to || "");
      setValue("due_date", initialData.due_date || "");
      setValue("priority", initialData.priority);
      setValue("status", initialData.status || "TODO");
    }
  }, [initialData, setValue]);

  const handleFormSubmit = async (data: CreateTaskParams) => {
    await onSubmit({
      title: data.title,
      description: data.description || undefined,
      project: data.project,
      assigned_to: data.assigned_to || undefined,
      due_date: data.due_date || undefined,
      priority: data.priority,
      status: data.status,
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
        isSubmitting={isSubmitting}
        disabled={!canSubmit}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">
                  Project <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={selectedProject || ""}
                  onValueChange={(value) => setValue("project", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="project" className="h-9">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assign To</Label>
                <Select
                  value={selectedAssignee || ""}
                  onValueChange={(value) => setValue("assigned_to", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="assigned_to" className="h-9">
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={selectedPriority || "MEDIUM"}
                  onValueChange={(value) =>
                    setValue("priority", value as TaskPriority)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="priority" className="h-9">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  {...register("due_date")}
                  disabled={isSubmitting}
                />
              </div>

              {isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={selectedStatus || "TODO"}
                    onValueChange={(value) =>
                      setValue("status", value as TaskStatus)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="status" className="h-9">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
