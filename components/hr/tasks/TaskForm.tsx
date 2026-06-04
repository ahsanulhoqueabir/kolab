"use client";

import { useForm } from "react-hook-form";
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
import type { TaskPriority, TaskStatus } from "@/types/db/task.types";

export interface TaskFormValues {
  title: string;
  description: string;
  project: string;
  assigned_to: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
}

interface TaskFormProps {
  isSubmitting?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: ReturnType<typeof useForm<TaskFormValues>>["register"];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: ReturnType<typeof useForm<TaskFormValues>>["formState"]["errors"];
  setValue: (name: keyof TaskFormValues, value: string) => void;
  watch: (name: keyof TaskFormValues) => string | undefined;
  projects: { id: string; name: string }[];
  users: { id: string; name: string }[];
  showStatus?: boolean;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

export function TaskForm({
  register,
  errors,
  setValue,
  watch,
  projects,
  users,
  isSubmitting,
  showStatus,
}: TaskFormProps) {
  const selectedPriority = watch("priority");
  const selectedStatus = watch("status");
  const selectedProject = watch("project");
  const selectedAssignee = watch("assigned_to");

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">
              Title <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="title"
              {...register("title", {
                required: "Task title is required",
                minLength: {
                  value: 2,
                  message: "Title must be at least 2 characters",
                },
              })}
              placeholder="Enter task title"
              className={errors.title ? "border-destructive" : ""}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register("description")}
              placeholder="Enter task description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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

          {showStatus && (
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
  );
}
