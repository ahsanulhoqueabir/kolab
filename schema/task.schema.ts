import type {
  CreateTaskParams,
  TaskPriority,
  TaskStatus,
} from "@/types/db/task.types";

export const TASK_DEFAULT_VALUES: CreateTaskParams = {
  title: "",
  description: "",
  project: "",
  assigned_to: "",
  due_date: "",
  priority: "MEDIUM" as TaskPriority,
  status: "TODO" as TaskStatus,
  attachment: [],
};

export const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

export const TASK_VALIDATION_RULES = {
  title: {
    required: "Task title is required",
    minLength: { value: 2, message: "Title must be at least 2 characters" },
  },
} as const;
