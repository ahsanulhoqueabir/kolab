import { DashboardService } from "@/services/dashboard.service";
import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";

/**
 * GET /api/dashboard
 * Returns all aggregated dashboard data.
 * Requires dashboard:read:all or dashboard:read:own.
 */
export const GET = withAuth({
  permissions: ["dashboard:read:all", "dashboard:read:own"],
})(async ({ user }) => {
  try {
    const result = await DashboardService.getAll(user.profile, user.conditions);

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "DASHBOARD_FETCH_FAILED" });
  } catch {
    return fail({ error: "DASHBOARD_FETCH_FAILED" });
  }
});
