import { UserService } from "@/services/user.service";
import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";
import type { CreateUserParams } from "@/types/db/user.types";

/**
 * GET /api/users
 * Lists all users. Requires user:read permission.
 */
export const GET = withAuth({ permissions: "user:read" })(async ({ req }) => {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const role = url.searchParams.get("role") || undefined;
    const active =
      url.searchParams.get("active") !== null
        ? url.searchParams.get("active") === "true"
        : undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "50", 10);

    const result = await UserService.list({
      search,
      role,
      active,
      page,
      pageSize,
    });

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "USER_FETCH_FAILED" });
  } catch {
    return fail({ error: "USER_FETCH_FAILED" });
  }
});

/**
 * POST /api/users
 * Creates a new user. Requires user:create permission.
 */
export const POST = withAuth({ permissions: "user:create" })(async ({
  req,
}) => {
  try {
    const body = (await req.json()) as CreateUserParams;

    if (!body.name || !body.email || !body.password || !body.role) {
      return fail({ error: "USER_CREATE_BAD_REQUEST" });
    }

    const result = await UserService.create(body);

    if (result.success) {
      return ok({
        data: result.data,
        statusCode: 201,
      });
    }
    return fail({ error: result.error || "USER_CREATE_FAILED" });
  } catch {
    return fail({ error: "USER_CREATE_FAILED" });
  }
});
