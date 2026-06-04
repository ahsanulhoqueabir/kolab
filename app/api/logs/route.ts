import { LogService } from "@/services/log.service";
import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";

/**
 * GET /api/logs
 * Lists recent activities. Requires log:read:all permission.
 */
export const GET = withAuth({ permissions: "log:read:all" })(async ({
  req,
}) => {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);
    const projectId = url.searchParams.get("projectId") || undefined;

    let result;
    if (projectId) {
      result = await LogService.listByProject(projectId, limit);
    } else {
      result = await LogService.list(limit, offset);
    }

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "LOG_FETCH_FAILED" });
  } catch {
    return fail({ error: "LOG_FETCH_FAILED" });
  }
});
