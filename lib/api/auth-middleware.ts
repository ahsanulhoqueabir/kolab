/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/api/jwt.helper";
import { ProfileService } from "@/services/profile.service";
import type {
  AuthenticatedUser,
  AuthConfig,
  AuthContext,
} from "@/types/business/auth.types";

export type AuthenticatedHandler = (ctx: AuthContext) => Promise<NextResponse>;

/**
 * Wraps an API route handler with JWT authentication and optional permissions check.
 * Uses a single config object pattern.
 *
 * Usage:
 * ```ts
 * // No permissions required (just auth check)
 * export const GET = withAuth()(async ({ req, user, params }) => { ... });
 *
 * // With permissions
 * export const POST = withAuth({ permissions: "project:create" })(async ({ req, user }) => { ... });
 *
 * // Multiple permissions + return full permission list
 * export const PATCH = withAuth({
 *   permissions: ["project:update:all", "project:update:own"],
 *   returnPermissions: true,
 * })(async ({ req, user, params }) => { ... });
 * ```
 */
export function withAuth(config?: AuthConfig) {
  return (handler: AuthenticatedHandler) => {
    return async (req: NextRequest, context?: any): Promise<NextResponse> => {
      try {
        const authHeader = req.headers.get("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return NextResponse.json(
            {
              success: false,
              error: "Missing or invalid Authorization header",
              errorType: "INVALID_TOKEN",
            },
            { status: 401 },
          );
        }

        const token = authHeader.slice(7);
        const permissions = config?.permissions;
        const result = await verifyToken(token, permissions);

        if (!result.valid || !result.user) {
          const statusCode =
            result.errorType === "PERMISSION_DENIED" ? 403 : 401;
          return NextResponse.json(
            {
              success: false,
              error: result.error || "Authentication failed",
              errorType: result.errorType,
            },
            { status: statusCode },
          );
        }

        const authenticatedUser: AuthenticatedUser = {
          profile: result.user.profile,
          email: result.user.email,
          role: result.user.role,
          conditions: result.conditions,
        };

        // Optionally fetch and attach full permission list
        if (config?.returnPermissions) {
          const permResult = await ProfileService.permissions(
            result.user.profile,
          );
          if (permResult.success && permResult.data) {
            authenticatedUser.permissions = permResult.data.permissions;
          }
        }

        // Extract route params from Next.js context
        let params: Record<string, string> = {};
        if (context?.params) {
          const resolvedParams = await (context.params instanceof Promise
            ? context.params
            : Promise.resolve(context.params));
          params = resolvedParams || {};
        }

        const authCtx: AuthContext = {
          req,
          user: authenticatedUser,
          params,
        };

        return handler(authCtx);
      } catch (err) {
        return NextResponse.json(
          {
            success: false,
            error: (err as Error).message || "Authentication failed",
            errorType: "AUTH_ERROR",
          },
          { status: 401 },
        );
      }
    };
  };
}
