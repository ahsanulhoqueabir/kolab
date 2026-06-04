import type {
  CreateProjectParams,
  ProjectStatus,
} from "@/types/db/project.types";

export const PROJECT_DEFAULT_VALUES: CreateProjectParams = {
  name: "",
  description: "",
  deadline: "",
  status: "DRAFT" as ProjectStatus,
};

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] =
  [
    { value: "DRAFT", label: "Draft" },
    { value: "ACTIVE", label: "Active" },
    { value: "ON_HOLD", label: "On Hold" },
    { value: "COMPLETED", label: "Completed" },
  ];

export const PROJECT_VALIDATION_RULES = {
  name: {
    required: "Project name is required",
    minLength: { value: 2, message: "Name must be at least 2 characters" },
  },
} as const;
