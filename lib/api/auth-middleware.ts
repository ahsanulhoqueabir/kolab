/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/api/jwt.helper";
import type { AuthenticatedUser } from "@/types/business/auth.types";

export type AuthenticatedHandler = (
  req: NextRequest,
  user: AuthenticatedUser,
  context?: any,
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with JWT authentication and optional permissions check.
 * Extracts the Bearer token from the Authorization header,
 * verifies it, and passes the decoded user payload to the handler.
 *
 * Usage:
 * ```ts
 * export const GET = withAuth(async (req, user) => { … });
 * export const POST = withAuth("item:create", async (req, user) => { … });
 * export const PUT = withAuth(["item:update", "item:update:own"], async (req, user) => { … });
 * ```
 */
export function withAuth(
  handler: AuthenticatedHandler,
): (req: NextRequest, context?: any) => Promise<NextResponse>;

export function withAuth(
  permissions: string | string[],
  handler: AuthenticatedHandler,
): (req: NextRequest, context?: any) => Promise<NextResponse>;

export function withAuth(
  first: string | string[] | AuthenticatedHandler,
  second?: AuthenticatedHandler,
) {
  const permissions = typeof first === "function" ? undefined : first;
  const handler = typeof first === "function" ? (first as AuthenticatedHandler) : second!;

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

      const token = authHeader.slice(7); // Strip "Bearer "
      const result = await verifyToken(token, permissions);

      if (!result.valid || !result.user) {
        const statusCode = result.errorType === "PERMISSION_DENIED" ? 403 : 401;
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

      return handler(req, authenticatedUser, context);
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
}
