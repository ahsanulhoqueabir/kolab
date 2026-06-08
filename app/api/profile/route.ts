import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";
import { ProfileService } from "@/services/profile.service";

/**
 * PATCH /api/profile
 * Update own profile (name, phone, image, password).
 * Email, role, and active cannot be changed here.
 *
 * Image handling:
 * - Image is already a public URL (client uploads directly to R2 via signed URL).
 * - If image is empty/null → remove the image.
 * - Otherwise → store as-is.
 */
export const PATCH = withAuth()(async ({ req, user }) => {
  try {
    const profileId = user.profile;
    const body = (await req.json()) as Record<string, unknown>;

    const updateData: Record<string, unknown> = {};
    const allowedFields = ["name", "phone", "image", "password"];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // ── Image handling ──────────────────────────────────────────
    if (updateData.image !== undefined) {
      const rawImage = updateData.image as string;

      if (!rawImage) {
        // Empty/null → remove image
        updateData.image = null;
      }
      // else: already a public URL → keep as-is
    }

    // ── Password handling ───────────────────────────────────────
    // Password will be hashed inside ProfileService.update

    const result = await ProfileService.update(profileId, updateData);

    if (result.success) {
      // Remove password from response
      const { password: _p, ...safeData } = result.data as unknown as {
        password?: string;
        [key: string]: unknown;
      };
      return ok({ data: safeData, message: "Profile updated successfully" });
    }

    return fail({ error: result.error || "PROFILE_UPDATE_FAILED" });
  } catch (err) {
    return fail({
      error: (err as Error).message || "PROFILE_UPDATE_FAILED",
    });
  }
});
