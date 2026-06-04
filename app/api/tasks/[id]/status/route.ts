import { TaskService } from "@/services/task.service";
import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";
import type { TaskStatus } from "@/types/db/task.types";

/**
 * PATCH /api/tasks/[id]/status
 * Quick status update for drag-drop or checkbox.
 * Requires task:update:all, task:update:own, or task:update:assigned.
 */
export const PATCH = withAuth({
  permissions: ["task:update:all", "task:update:own", "task:update:assigned"],
})(async ({ req, user, params }) => {
  try {
    const id = params.id;

    if (!id) {
      return fail({ error: "TASK_BAD_REQUEST" });
    }

    const { status } = (await req.json()) as { status: TaskStatus };

    if (!status || !["TODO", "IN_PROGRESS", "COMPLETED"].includes(status)) {
      return fail({ error: "TASK_STATUS_INVALID" });
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

    if (
      !hasAllAccess &&
      !(hasOwnAccess && isOwner) &&
      !(hasAssignedAccess && isAssigned)
    ) {
      return fail({
        error: "You do not have permission to update this task's status",
        statusCode: 403,
      });
    }

    const result = await TaskService.updateStatus(id, status, user.profile);

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "TASK_STATUS_UPDATE_FAILED" });
  } catch {
    return fail({ error: "TASK_STATUS_UPDATE_FAILED" });
  }
});
