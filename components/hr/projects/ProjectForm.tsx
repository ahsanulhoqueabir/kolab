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
import type { ProjectStatus } from "@/types/db/project.types";

export interface ProjectFormValues {
  name: string;
  description: string;
  deadline: string;
  status: ProjectStatus;
}

interface ProjectFormProps {
  defaultValues?: Partial<ProjectFormValues>;
  isSubmitting?: boolean;
  register: ReturnType<typeof useForm<ProjectFormValues>>["register"];
  errors: ReturnType<typeof useForm<ProjectFormValues>>["formState"]["errors"];
  setValue: (name: keyof ProjectFormValues, value: string) => void;
  watch: (name: keyof ProjectFormValues) => string | undefined;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
];

export function ProjectForm({
  register,
  errors,
  setValue,
  watch,
  isSubmitting,
}: ProjectFormProps) {
  const selectedStatus = watch("status");

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">
              Project Name <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="name"
              {...register("name", {
                required: "Project name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters",
                },
              })}
              placeholder="Enter project name"
              className={errors.name ? "border-destructive" : ""}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
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
                {STATUS_OPTIONS.map((opt) => (
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
  );
}
