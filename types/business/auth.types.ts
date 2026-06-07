import { NextRequest } from "next/server";

export interface AuthCondition {
  own?: boolean;
  all?: boolean;
  assigned?: boolean;
}

export interface JwtVerifyResult {
  valid: boolean;
  error?: string;
  errorType?: string;
  conditions?: AuthCondition;
  user?: {
    profile: string;
    email: string;
    role: string;
    session: string;
  };
}

export interface AuthenticatedUser {
  profile: string;
  email: string;
  role: string;
  conditions?: AuthCondition;
  permissions?: string[];
  session?: string;
}

export type AuthConfig = {
  permissions?: string | string[];
  /** If true, returns the user's full permission list */
  returnPermissions?: boolean;
};

export type AuthContext = {
  req: NextRequest;
  user: AuthenticatedUser;
  params: Record<string, string>;
};
