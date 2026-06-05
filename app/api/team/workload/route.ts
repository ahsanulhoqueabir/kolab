import { TeamService } from "@/services/team.service";
import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";

/**
 * GET /api/team/workload
 * Gets workload summary per member.
 * Requires project:read:all or project:read:own.
 */
export const GET = withAuth({
  permissions: ["project:read:all", "project:read:own"],
})(async ({ req }) => {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId") || undefined;

    const result = await TeamService.getWorkload(projectId);

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "WORKLOAD_FETCH_FAILED" });
  } catch {
    return fail({ error: "WORKLOAD_FETCH_FAILED" });
  }
});
