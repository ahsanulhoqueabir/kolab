import { UserService } from "@/services/user.service";
import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";
import type { UpdateUserParams } from "@/types/db/user.types";

/**
 * GET /api/users/[id]
 * Get a single user. Requires user:read permission.
 */
export const GET = withAuth({ permissions: "user:read" })(async ({
  params,
}) => {
  try {
    const id = params.id;

    if (!id) {
      return fail({ error: "USER_BAD_REQUEST" });
    }

    const result = await UserService.find(id);
    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "USER_FETCH_FAILED" });
  } catch {
    return fail({ error: "USER_FETCH_FAILED" });
  }
});

/**
 * PATCH /api/users/[id]
 * Update a user. Requires user:update:all or user:update:own.
 * If user:update:own, the user can only update their own profile.
 */
export const PATCH = withAuth({
  permissions: ["user:update:all", "user:update:own"],
})(async ({ req, user, params }) => {
  try {
    const id = params.id;

    if (!id) {
      return fail({ error: "USER_BAD_REQUEST" });
    }

    // Own-check: if user only has user:update:own, they can only update themselves
    const hasAllAccess = user.conditions?.all;
    if (!hasAllAccess) {
      // Only own access — verify the target ID matches the authenticated user's profile
      if (user.profile !== id) {
        return fail({
          error: "You can only update your own profile",
          statusCode: 403,
        });
      }
    }

    const body = (await req.json()) as UpdateUserParams;
    const result = await UserService.update(id, body);

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "USER_UPDATE_FAILED" });
  } catch {
    return fail({ error: "USER_UPDATE_FAILED" });
  }
});

/**
 * DELETE /api/users/[id]
 * Delete a user. Requires user:delete permission.
 */
export const DELETE = withAuth({ permissions: "user:delete" })(async ({
  params,
}) => {
  try {
    const id = params.id;

    if (!id) {
      return fail({ error: "USER_BAD_REQUEST" });
    }

    // Validate the user exists
    const validResult = await UserService.valid(id);

    if (!validResult.success) {
      return fail({
        error: validResult.error || "USER_NOT_FOUND",
      });
    }

    // Check if user can be deleted
    const statusResult = await UserService.checkDeleteStatus(id);
    if (!statusResult.success) {
      return fail({
        error: statusResult.error || "DELETE_STATUS_CHECK_FAILED",
      });
    }

    if (!statusResult.data.canDelete) {
      return fail({
        error: statusResult.data.meta?.message || "User cannot be deleted",
        statusCode: 409,
      });
    }

    const result = await UserService.delete(id);

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "USER_DELETE_FAILED" });
  } catch {
    return fail({ error: "USER_DELETE_FAILED" });
  }
});
