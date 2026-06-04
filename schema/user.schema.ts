import { ProfileFormData } from "@/types/db/profile.types";

export const USER_DEFAULT_VALUES: ProfileFormData = {
  name: "",
  email: "",
  password: "",
  role: "",
};

export const USER_EDIT_DEFAULT_VALUES: ProfileFormData = {
  name: "",
  email: "",
  password: "",
  role: "",
  active: true,
};

export const USER_VALIDATION_RULES = {
  name: {
    required: "Name is required",
    minLength: { value: 2, message: "Name must be at least 2 characters" },
  },
  email: {
    required: "Email is required",
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Invalid email address",
    },
  },
  password: {
    required: "Password is required",
    minLength: {
      value: 6,
      message: "Password must be at least 6 characters",
    },
  },
  optionalPassword: {
    minLength: {
      value: 6,
      message: "Password must be at least 6 characters",
    },
  },
} as const;
