import { TeamService } from "@/services/team.service";
import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";

/**
 * DELETE /api/team/[id]
 * Removes a member from a project.
 * Requires project:update:all or project:update:own.
 * Query params: projectId (required)
 */
export const DELETE = withAuth({
  permissions: ["project:update:all", "project:update:own"],
})(async ({ req, user, params }) => {
  try {
    const profileId = params.id;
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");

    if (!profileId || !projectId) {
      return fail({ error: "TEAM_REMOVE_BAD_REQUEST" });
    }

    const result = await TeamService.removeMember(
      projectId,
      profileId,
      user.profile,
    );

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "TEAM_REMOVE_FAILED" });
  } catch {
    return fail({ error: "TEAM_REMOVE_FAILED" });
  }
});
