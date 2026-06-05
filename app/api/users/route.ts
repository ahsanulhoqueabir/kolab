import { UserService } from "@/services/user.service";
import { R2Service } from "@/services/r2.service";
import { LogService } from "@/services/log.service";
import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";
import type { CreateUserParams } from "@/types/db/user.types";

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
 * GET /api/users
 * Lists all users. Requires user:read permission.
 */
export const GET = withAuth({ permissions: "user:read" })(async ({ req }) => {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const role = url.searchParams.get("role") || undefined;
    const active =
      url.searchParams.get("active") !== null
        ? url.searchParams.get("active") === "true"
        : undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "50", 10);

    const result = await UserService.list({
      search,
      role,
      active,
      page,
      pageSize,
    });

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "USER_FETCH_FAILED" });
  } catch {
    return fail({ error: "USER_FETCH_FAILED" });
  }
});

/**
 * POST /api/users
 * Creates a new user. Requires user:create permission.
 * Handles base64 image upload to R2 before creating the user.
 * Creates an activity log entry (non-blocking).
 */
export const POST = withAuth({ permissions: "user:create" })(async ({
  req,
  user,
}) => {
  try {
    const body = (await req.json()) as CreateUserParams;

    if (!body.name || !body.email || !body.password || !body.role) {
      return fail({ error: "USER_CREATE_BAD_REQUEST" });
    }

    // ── Image handling: base64 → R2 ────────────────────────────
    let imageUrl: string | null | undefined = body.image;
    if (body.image) {
      imageUrl = await uploadBase64Image(body.image, `user-${Date.now()}`);
    }

    const result = await UserService.create({
      ...body,
      image: imageUrl || undefined,
    });

    if (result.success) {
      // Non-blocking: log the activity
      LogService.create({
        actor: user.profile,
        table: "profile",
        row: result.data.id,
        action: "CREATE",
        description: `User "${body.name}" created`,
      });

      return ok({
        data: result.data,
        statusCode: 201,
      });
    }
    return fail({ error: result.error || "USER_CREATE_FAILED" });
  } catch {
    return fail({ error: "USER_CREATE_FAILED" });
  }
});
