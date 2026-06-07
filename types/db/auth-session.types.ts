import { Profile } from "./profile.types";

export interface AuthSession {
  id: string;
  created_at: string;
  updated_at: string;
  profile: string | null; // Foreign key reference to Profile.id
  ip_address: string | null; // PostgreSQL inet type maps to string
  ip_location: IpLocation;
  device_type: DeviceType | null;
  device_name: string | null;
  device_brand: string | null;
  device_model: string | null;
  os_name: string | null;
  os_version: string | null;
  browser_name: string | null;
  browser_version: string | null;
  user_agent: string | null;
  screen_resolution: string | null;
  language: string | null;
  timezone: string | null;
  expires_at: string;
  auth_method: AuthMethod | null;
}

// Device type enum
export type DeviceType =
  | "mobile"
  | "tablet"
  | "desktop"
  | "bot"
  | "tv"
  | "console"
  | "unknown";

// Auth method enum
export type AuthMethod =
  | "password"
  | "oauth_google"
  | "oauth_github"
  | "magic_link"
  | "otp"
  | "biometric";

// Form data type for creating/updating sessions
export interface AuthSessionFormData extends Omit<
  AuthSession,
  "id" | "created_at" | "updated_at" | "ip_location"
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ip_location?: Record<string, any> | null;
}

// Optional: Type for IP location details (if you want more specific typing)
export interface IpLocation {
  country?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
}

// Optional: Session with joined profile data
export interface AuthSessionWithProfile extends Omit<AuthSession, "profile"> {
  profile?: Profile | null;
}
