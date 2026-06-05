import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";
import { RoleService } from "@/services/role.services";
import { ProjectService } from "@/services/project.service";
import { UserService } from "@/services/user.service";
import { TaskService } from "@/services/task.service";

/**
 * GET /api/search?type=role|project|user|task&value=xxx
 *
 * Unified search endpoint that delegates to each service's search() method.
 * Always returns max 10 results per type.
 */
export const GET = withAuth()(async ({ req }) => {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const value = url.searchParams.get("value");

    if (!type || !value || value.trim().length === 0) {
      return ok({ data: [] });
    }

    const searchValue = value.trim();
    let result;

    switch (type) {
      case "role":
        result = await RoleService.search(searchValue);
        break;
      case "project":
        result = await ProjectService.search(searchValue);
        break;
      case "user":
        result = await UserService.search(searchValue);
        break;
      case "task":
        result = await TaskService.search(searchValue);
        break;
      default:
        return fail({ error: `Unknown search type: ${type}` });
    }

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "SEARCH_FAILED" });
  } catch {
    return fail({ error: "SEARCH_FAILED" });
  }
});
