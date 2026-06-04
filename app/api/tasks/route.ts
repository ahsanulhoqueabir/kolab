import { TaskService } from "@/services/task.service";
import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";
import type { CreateTaskParams } from "@/types/db/task.types";

/**
 * GET /api/tasks
 * Lists tasks. Requires task:read:all, task:read:own, or task:read:assigned.
 */
export const GET = withAuth({
  permissions: ["task:read:all", "task:read:own", "task:read:assigned"],
})(async ({ req, user }) => {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const priority = url.searchParams.get("priority") || undefined;
    const project = url.searchParams.get("project") || undefined;
    const assignedTo = url.searchParams.get("assignedTo") || undefined;
    const deadlineStatus = url.searchParams.get("deadlineStatus") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "50", 10);

    const result = await TaskService.list({
      search,
      status,
      priority,
      project,
      assignedTo,
      deadlineStatus,
      profileId: user.profile,
      conditions: user.conditions,
      page,
      pageSize,
    });

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "TASK_FETCH_FAILED" });
  } catch {
    return fail({ error: "TASK_FETCH_FAILED" });
  }
});

/**
 * POST /api/tasks
 * Creates a new task. Requires task:create permission.
 */
export const POST = withAuth({ permissions: "task:create" })(async ({
  req,
  user,
}) => {
  try {
    const body = (await req.json()) as CreateTaskParams;

    if (!body.title || !body.project) {
      return fail({ error: "TASK_CREATE_BAD_REQUEST" });
    }

    const result = await TaskService.create({
      ...body,
      created_by: user.profile,
    });

    if (result.success) {
      return ok({
        data: result.data,
        statusCode: 201,
      });
    }
    return fail({ error: result.error || "TASK_CREATE_FAILED" });
  } catch {
    return fail({ error: "TASK_CREATE_FAILED" });
  }
});
