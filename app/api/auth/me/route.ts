import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/auth-middleware";
import { ProfileService } from "@/services/profile.service";
import type { JwtPayload } from "@/types/business/user.types";
import { fail, ok } from "@/lib/api/api-response";

/**
 * GET /api/auth/me
 *
 * Protected route — returns the authenticated user's profile data.
 * The JWT token is verified by `withAuth`, and the decoded payload
 * (which contains the profile ID) is passed to the handler.
 */
export const GET = withAuth(
  async (_req: NextRequest, jwtPayload: JwtPayload) => {
    const result = await ProfileService.getById(jwtPayload.profile);

    if (!result.success) {
      return fail({ error: result.error, statusCode: 404 });
    }

    return ok({ data: result.data });
  },
);
