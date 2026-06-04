import { ProfileFormData } from "@/types/db/profile.types";

export const PROFILE_DEFAULT_VALUES: ProfileFormData = {
  name: "",
  email: "",
  password: "",
  role: "",
  confirmPassword: "",
};

export const PROFILE_VALIDATION_RULES = {
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
    minLength: {
      value: 6,
      message: "Password must be at least 6 characters",
    },
  },
  confirmPassword: {
    minLength: {
      value: 6,
      message: "Confirm Password must be at least 6 characters",
    },
  },
  role: {
    required: "Role is required",
  },
} as const;
