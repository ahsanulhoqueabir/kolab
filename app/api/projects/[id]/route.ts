import { ProjectService } from "@/services/project.service";
import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";
import type { UpdateProjectParams } from "@/types/db/project.types";

/**
 * GET /api/projects/[id]
 * Get a single project. Requires project:read:all or project:read:own.
 */
export const GET = withAuth({
  permissions: ["project:read:all", "project:read:own"],
})(async ({ params }) => {
  try {
    const id = params.id;

    if (!id) {
      return fail({ error: "PROJECT_BAD_REQUEST" });
    }

    const result = await ProjectService.find(id);
    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "PROJECT_FETCH_FAILED" });
  } catch {
    return fail({ error: "PROJECT_FETCH_FAILED" });
  }
});

/**
 * PATCH /api/projects/[id]
 * Update a project. Requires project:update:all or project:update:own.
 * If condition is "own", verifies project.created_by === user.profile.
 */
export const PATCH = withAuth({
  permissions: ["project:update:all", "project:update:own"],
})(async ({ req, user, params }) => {
  try {
    const id = params.id;

    if (!id) {
      return fail({ error: "PROJECT_BAD_REQUEST" });
    }

    // Own-check: if user only has project:update:own, verify ownership
    const hasAllAccess = user.conditions?.all;
    if (!hasAllAccess) {
      const project = await ProjectService.find(id);
      if (!project.success) {
        return fail({ error: project.error || "PROJECT_NOT_FOUND" });
      }

      const createdBy =
        typeof project.data.created_by === "object" &&
        project.data.created_by !== null
          ? (project.data.created_by as { id: string }).id
          : project.data.created_by;

      if (createdBy !== user.profile) {
        return fail({
          error: "You can only update your own projects",
          statusCode: 403,
        });
      }
    }

    const body = (await req.json()) as UpdateProjectParams;
    const result = await ProjectService.update(id, {
      ...body,
      updated_by: user.profile,
    });

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "PROJECT_UPDATE_FAILED" });
  } catch {
    return fail({ error: "PROJECT_UPDATE_FAILED" });
  }
});

/**
 * DELETE /api/projects/[id]
 * Delete a project. Requires project:delete permission.
 */
export const DELETE = withAuth({ permissions: "project:delete" })(async ({
  params,
  user,
}) => {
  try {
    const id = params.id;

    if (!id) {
      return fail({ error: "PROJECT_BAD_REQUEST" });
    }

    // Validate the project exists
    const validResult = await ProjectService.valid(id);
    if (!validResult.success) {
      return fail({
        error: validResult.error || "PROJECT_NOT_FOUND",
      });
    }

    const result = await ProjectService.delete(id, user.profile);

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "PROJECT_DELETE_FAILED" });
  } catch {
    return fail({ error: "PROJECT_DELETE_FAILED" });
  }
});
