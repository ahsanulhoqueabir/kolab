import { TeamService } from "@/services/team.service";
import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";

/**
 * GET /api/team/list
 *
 * Unified team listing that respects user permissions:
 * - team:read:all → returns ALL team entries (grouped by project on the client)
 * - team:read:own → returns only entries where user is a MANAGER
 */
export const GET = withAuth({
  permissions: ["project:read:all", "project:read:own"],
  returnPermissions: true,
})(async ({ user }) => {
  try {
    const conditions = user.conditions || {};
    const permissions = user.permissions || [];

    const hasAll = conditions.all || permissions.includes("project:read:all");
    const hasOwn = conditions.own || permissions.includes("project:read:own");

    const result = await TeamService.listUnified({
      profileId: user.profile,
      conditions: { all: hasAll, own: hasOwn },
    });

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "TEAM_LIST_UNIFIED_FAILED" });
  } catch {
    return fail({ error: "TEAM_LIST_UNIFIED_FAILED" });
  }
});
