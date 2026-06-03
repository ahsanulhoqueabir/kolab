import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/api/jwt.helper";
import type { JwtPayload } from "@/types/business/user.types";

export type AuthenticatedHandler = (
  req: NextRequest,
  jwtPayload: JwtPayload,
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with JWT authentication.
 * Extracts the Bearer token from the Authorization header,
 * verifies it, and passes the decoded payload to the handler.
 *
 * Usage:
 * ```ts
 * export const GET = withAuth(async (req, jwtPayload) => { … });
 * ```
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get("Authorization");

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          { success: false, error: "Missing or invalid Authorization header" },
          { status: 401 },
        );
      }

      const token = authHeader.slice(7); // Strip "Bearer "
      const payload = await verifyJwt(token);

      if (!payload) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired token" },
          { status: 401 },
        );
      }

      return handler(req, payload);
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error: (err as Error).message || "Authentication failed",
        },
        { status: 401 },
      );
    }
  };
}
