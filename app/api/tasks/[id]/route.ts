import { TaskService } from "@/services/task.service";
import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";
import type { UpdateTaskParams } from "@/types/db/task.types";

/**
 * GET /api/tasks/[id]
 * Get a single task. Requires task:read:all, task:read:own, or task:read:assigned.
 */
export const GET = withAuth({
  permissions: ["task:read:all", "task:read:own", "task:read:assigned"],
})(async ({ params }) => {
  try {
    const id = params.id;

    if (!id) {
      return fail({ error: "TASK_BAD_REQUEST" });
    }

    const result = await TaskService.find(id);
    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "TASK_FETCH_FAILED" });
  } catch {
    return fail({ error: "TASK_FETCH_FAILED" });
  }
});

/**
 * PATCH /api/tasks/[id]
 * Update a task. Requires task:update:all, task:update:own, or task:update:assigned.
 *
 * Permission logic:
 * - task:update:all → full update access
 * - task:update:own → can only update own tasks (cannot change assigned_to, project)
 * - task:update:assigned → can only update status of assigned tasks
 */
export const PATCH = withAuth({
  permissions: ["task:update:all", "task:update:own", "task:update:assigned"],
})(async ({ req, user, params }) => {
  try {
    const id = params.id;

    if (!id) {
      return fail({ error: "TASK_BAD_REQUEST" });
    }

    // Fetch the current task to check ownership/assignment
    const task = await TaskService.find(id);
    if (!task.success) {
      return fail({ error: task.error || "TASK_NOT_FOUND" });
    }

    const hasAllAccess = user.conditions?.all;
    const hasOwnAccess = user.conditions?.own;
    const hasAssignedAccess = user.conditions?.assigned;

    const taskData = task.data;
    const createdBy =
      typeof taskData.created_by === "object" && taskData.created_by !== null
        ? (taskData.created_by as { id: string }).id
        : taskData.created_by;

    const assignedTo =
      typeof taskData.assigned_to === "object" && taskData.assigned_to !== null
        ? (taskData.assigned_to as { id: string }).id
        : taskData.assigned_to;

    const isOwner = createdBy === user.profile;
    const isAssigned = assignedTo === user.profile;

    const body = (await req.json()) as UpdateTaskParams;

    if (!hasAllAccess) {
      if (hasOwnAccess && isOwner) {
        // Own access: cannot change assigned_to or project
        if (body.assigned_to !== undefined || body.project !== undefined) {
          return fail({
            error: "You cannot change the assignee or project of your own task",
            statusCode: 403,
          });
        }
      } else if (hasAssignedAccess && isAssigned) {
        // Assigned access: can only update status
        const allowedFields: (keyof UpdateTaskParams)[] = ["status"];
        const attemptedFields = Object.keys(body) as (keyof UpdateTaskParams)[];
        const disallowed = attemptedFields.filter(
          (f) => !allowedFields.includes(f),
        );
        if (disallowed.length > 0) {
          return fail({
            error: "You can only update the status of tasks assigned to you",
            statusCode: 403,
          });
        }
      } else {
        return fail({
          error: "You do not have permission to update this task",
          statusCode: 403,
        });
      }
    }

    const result = await TaskService.update(id, {
      ...body,
      updated_by: user.profile,
    });

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "TASK_UPDATE_FAILED" });
  } catch {
    return fail({ error: "TASK_UPDATE_FAILED" });
  }
});

/**
 * DELETE /api/tasks/[id]
 * Delete a task. Requires task:delete:all or task:delete:own.
 */
export const DELETE = withAuth({
  permissions: ["task:delete:all", "task:delete:own"],
})(async ({ user, params }) => {
  try {
    const id = params.id;

    if (!id) {
      return fail({ error: "TASK_BAD_REQUEST" });
    }

    // Own-check: if user only has task:delete:own, verify ownership
    const hasAllAccess = user.conditions?.all;
    if (!hasAllAccess) {
      const task = await TaskService.find(id);
      if (!task.success) {
        return fail({ error: task.error || "TASK_NOT_FOUND" });
      }

      const createdBy =
        typeof task.data.created_by === "object" &&
        task.data.created_by !== null
          ? (task.data.created_by as { id: string }).id
          : task.data.created_by;

      if (createdBy !== user.profile) {
        return fail({
          error: "You can only delete your own tasks",
          statusCode: 403,
        });
      }
    }

    const result = await TaskService.delete(id, user.profile);

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "TASK_DELETE_FAILED" });
  } catch {
    return fail({ error: "TASK_DELETE_FAILED" });
  }
});
