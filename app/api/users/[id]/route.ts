import { UserService } from "@/services/user.service";
import { R2Service } from "@/services/r2.service";
import { LogService } from "@/services/log.service";
import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";
import type { UpdateUserParams } from "@/types/db/user.types";

/**
 * Upload a base64 image to R2 and return the public URL.
 * Returns null if no image or invalid format.
 */
async function uploadBase64Image(
  rawImage: string,
  prefix: string,
): Promise<string | null> {
  if (!rawImage) return null;

  // Already a URL — keep as-is
  if (rawImage.startsWith("http")) return rawImage;

  // Base64 data URI → upload to R2
  const mimeMatch = rawImage.match(/^data:(image\/(\w+));base64,/);
  if (!mimeMatch) return null;

  const ext = mimeMatch[2];
  const base64Data = rawImage.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const result = await R2Service.uploadObject({
    body: buffer,
    fileName: `${prefix}.${ext}`,
    folder: "profiles",
    contentType: mimeMatch[1],
  });

  return result.success && result.publicUrl ? result.publicUrl : null;
}

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
 * Handles base64 image upload to R2 before updating.
 * Creates an activity log entry (non-blocking).
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

    // ── Image handling: base64 → R2 ────────────────────────────
    if (body.image !== undefined) {
      if (!body.image) {
        // Empty string → remove image
        body.image = null as unknown as undefined;
      } else if (body.image.startsWith("data:")) {
        const imageUrl = await uploadBase64Image(body.image, `user-${id}`);
        body.image = imageUrl || undefined;
      }
      // else: already an https URL → keep as-is
    }

    const result = await UserService.update(id, body);

    if (result.success) {
      // Non-blocking: log the activity
      LogService.create({
        actor: user.profile,
        table: "profile",
        row: id,
        action: "UPDATE",
        description: `User "${result.data.name || body.name || id}" updated`,
      });

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
 * Creates an activity log entry (non-blocking).
 */
export const DELETE = withAuth({ permissions: "user:delete" })(async ({
  params,
  user,
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

    const deletedName =
      statusResult.data.meta?.message || validResult.data?.name || id;
    const result = await UserService.delete(id);

    if (result.success) {
      // Non-blocking: log the activity
      LogService.create({
        actor: user.profile,
        table: "profile",
        row: id,
        action: "DELETE",
        description: `User "${deletedName}" deleted`,
      });

      return ok({ data: result.data });
    }
    return fail({ error: result.error || "USER_DELETE_FAILED" });
  } catch {
    return fail({ error: "USER_DELETE_FAILED" });
  }
});
