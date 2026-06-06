import { R2Service } from "@/services/r2.service";
import type { SignedUploadRequest } from "@/services/r2.service";
import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";

/**
 * POST /api/r2/signed-upload-urls
 *
 * Accepts an array of file descriptors and returns pre-signed PutObject URLs
 * (30-min expiry) so the client can upload files directly to Cloudflare R2.
 *
 * Body: { files: { fileName: string; contentType: string }[], folder?: string }
 *
 * Response:
 * {
 *   success: true,
 *   data: [
 *     { key: string, signedUrl: string, publicUrl: string },
 *     ...
 *   ]
 * }
 */
export const POST = withAuth()(async ({ req }) => {
  try {
    const body = (await req.json()) as {
      files: SignedUploadRequest[];
      folder?: string;
    };

    if (!body.files || !Array.isArray(body.files) || body.files.length === 0) {
      return fail({ error: "R2_SIGNED_URLS_BAD_REQUEST" });
    }

    // Validate each file entry
    for (const f of body.files) {
      if (!f.fileName || !f.contentType) {
        return fail({ error: "R2_SIGNED_URLS_BAD_REQUEST" });
      }
    }

    const results = await R2Service.generateSignedUploadUrls(
      body.files,
      body.folder || "",
      1800, // 30 minutes
    );

    return ok({ data: results });
  } catch {
    return fail({ error: "R2_SIGNED_URLS_FAILED" });
  }
});
