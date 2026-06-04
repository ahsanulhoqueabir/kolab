import { TeamService } from "@/services/team.service";
import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";
import type { AddMemberParams } from "@/types/db/team.types";

/**
 * GET /api/team
 * Lists team members for a project. Requires project:read:all or project:read:own.
 */
export const GET = withAuth({
  permissions: ["project:read:all", "project:read:own"],
})(async ({ req }) => {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return fail({ error: "TEAM_PROJECT_ID_REQUIRED" });
    }

    const result = await TeamService.listByProject(projectId);

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "TEAM_FETCH_FAILED" });
  } catch {
    return fail({ error: "TEAM_FETCH_FAILED" });
  }
});

/**
 * POST /api/team
 * Adds a member to a project. Requires project:update:all or project:update:own.
 */
export const POST = withAuth({
  permissions: ["project:update:all", "project:update:own"],
})(async ({ req, user }) => {
  try {
    const body = (await req.json()) as AddMemberParams;

    if (!body.project || !body.profile) {
      return fail({ error: "TEAM_ADD_BAD_REQUEST" });
    }

    const result = await TeamService.addMember({
      ...body,
      actor: user.profile,
    });

    if (result.success) {
      return ok({
        data: result.data,
        statusCode: 201,
      });
    }
    return fail({ error: result.error || "TEAM_ADD_FAILED" });
  } catch {
    return fail({ error: "TEAM_ADD_FAILED" });
  }
});
