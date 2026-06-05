import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";
import { ProfileService } from "@/services/profile.service";
import { R2Service } from "@/services/r2.service";

/**
 * PATCH /api/profile
 * Update own profile (name, phone, image, password).
 * Email, role, and active cannot be changed here.
 *
 * Image handling:
 * - If image is a base64 data URI → upload to R2, store the public URL.
 * - If image is already an https URL → skip upload, store as-is.
 * - If image is empty/null → remove the image.
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
      } else if (rawImage.startsWith("data:")) {
        // Base64 data URI → upload to R2
        const mimeMatch = rawImage.match(/^data:(image\/(\w+));base64,/);
        if (!mimeMatch) {
          return fail({ error: "Invalid image format" });
        }

        const ext = mimeMatch[2];
        const base64Data = rawImage.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        const uploadResult = await R2Service.uploadObject({
          body: buffer,
          fileName: `profile-${profileId}.${ext}`,
          folder: "profiles",
          contentType: mimeMatch[1],
        });

        if (!uploadResult.success || !uploadResult.publicUrl) {
          return fail({
            error: uploadResult.error || "Failed to upload image",
          });
        }

        updateData.image = uploadResult.publicUrl;
      }
      // else: already an https URL → keep as-is
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
