import { ProjectService } from "@/services/project.service";
import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";
import type { CreateProjectParams } from "@/types/db/project.types";

/**
 * GET /api/projects
 * Lists projects. Requires project:read:all or project:read:own.
 */
export const GET = withAuth({
  permissions: ["project:read:all", "project:read:own"],
})(async ({ req, user }) => {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const deadlineStatus = url.searchParams.get("deadlineStatus") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "3", 10);

    const result = await ProjectService.list({
      search,
      status,
      deadlineStatus,
      profileId: user.profile,
      conditions: user.conditions,
      page,
      pageSize,
    });

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "PROJECT_FETCH_FAILED" });
  } catch {
    return fail({ error: "PROJECT_FETCH_FAILED" });
  }
});

/**
 * POST /api/projects
 * Creates a new project. Requires project:create permission.
 */
export const POST = withAuth({ permissions: "project:create" })(async ({
  req,
  user,
}) => {
  try {
    const body = (await req.json()) as CreateProjectParams;

    if (!body.name) {
      return fail({ error: "PROJECT_CREATE_BAD_REQUEST" });
    }

    const result = await ProjectService.create({
      ...body,
      created_by: user.profile,
    });

    if (result.success) {
      return ok({
        data: result.data,
        statusCode: 201,
      });
    }
    return fail({ error: result.error || "PROJECT_CREATE_FAILED" });
  } catch {
    return fail({ error: "PROJECT_CREATE_FAILED" });
  }
});
