import { NextRequest } from "next/server";
import { RoleService } from "@/services/role.services";
import { withAuth } from "@/lib/api/auth-middleware";
import { getRouteParam } from "@/lib/api/request-payload";
import type { AuthenticatedUser } from "@/types/business/auth.types";
import { ok, fail } from "@/lib/api/api-response";
import { ContextType } from "@/types/types";

export const GET = withAuth(
  async (
    _request: NextRequest,
    _user: AuthenticatedUser,
    context: ContextType,
  ) => {
    try {
      const idParam = await getRouteParam(context, "id");

      if (!idParam) {
        return fail({ error: "ROLE_BAD_REQUEST" });
      }

      const result = await RoleService.find(idParam);
      if (result.success) {
        return ok({ data: result.data });
      }
      return fail({ error: result.error || "ROLE_FETCH_FAILED" });
    } catch {
      return fail({ error: "ROLE_FETCH_FAILED" });
    }
  },
);

export const DELETE = withAuth(
  async (
    _request: NextRequest,
    _user: AuthenticatedUser,
    context: ContextType,
  ) => {
    try {
      const idParam = await getRouteParam(context, "id");

      if (!idParam) {
        return fail({ error: "ROLE_BAD_REQUEST" });
      }

      // ── Validate the role exists ──
      const validResult = await RoleService.valid(idParam);

      if (!validResult.success) {
        return fail({
          error: validResult.error || "ROLE_NOT_FOUND",
        });
      }

      const result = await RoleService.delete(idParam);

      if (result.success) {
        return ok({ data: result.data });
      }
      return fail({ error: result.error || "ROLE_DELETE_FAILED" });
    } catch {
      return fail({ error: "ROLE_DELETE_FAILED" });
    }
  },
);
