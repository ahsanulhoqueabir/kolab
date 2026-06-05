import { CreateRoleParams } from "@/types/db/role.types";

export const ROLE_DEFAULT_VALUES: CreateRoleParams = {
  name: "",
  landing_page: "",
};

export const ROLE_VALIDATION_RULES = {
  name: {
    required: "Role name is required",
    minLength: { value: 2, message: "Role name must be at least 2 characters" },
  },
} as const;
