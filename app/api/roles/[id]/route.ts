import { RoleService } from "@/services/role.services";
import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";

export const GET = withAuth()(async ({ params }) => {
  try {
    const idParam = params.id;

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
});

export const DELETE = withAuth()(async ({ params }) => {
  try {
    const idParam = params.id;

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
});
