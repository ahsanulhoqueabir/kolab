import { RoleService } from "@/services/role.services";
import { withAuth } from "@/lib/api/auth-middleware";
import { mergeRequestPayload } from "@/lib/api/request-payload";
import type { Role } from "@/types/db/role.types";
import { ok, fail } from "@/lib/api/api-response";

export const GET = withAuth()(async ({ req, user }) => {
  try {
    const result = await RoleService.list();
    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "ROLE_FETCH_FAILED" });
  } catch {
    return fail({ error: "ROLE_FETCH_FAILED" });
  }
});

export const POST = withAuth()(async ({ req }) => {
  try {
    const body: unknown = await req.json();

    if (Array.isArray(body)) {
      const roles = body as Array<Partial<Role>>;

      if (roles.length === 0 || roles.some((role) => !role.name)) {
        return fail({ error: "ROLE_CREATE_BAD_REQUEST" });
      }

      const result = await RoleService.createMany(roles as Omit<Role, "id">[]);

      if (result.success) {
        return ok({
          data: result.data,
          statusCode: 201,
        });
      }

      return fail({ error: result.error || "ROLE_CREATE_FAILED" });
    }

    const singleRole = mergeRequestPayload<Partial<Role>>(body);

    if (!singleRole.name) {
      return fail({ error: "ROLE_CREATE_BAD_REQUEST" });
    }

    const { name, ...rest } = singleRole;
    const result = await RoleService.create({
      ...rest,
      name,
    } as Omit<Role, "id">);

    if (result.success) {
      return ok({
        data: result.data,
        statusCode: 201,
      });
    }
    return fail({ error: result.error || "ROLE_CREATE_FAILED" });
  } catch {
    return fail({ error: "ROLE_CREATE_FAILED" });
  }
});

export const PATCH = withAuth()(async ({ req }) => {
  try {
    const body = mergeRequestPayload<Partial<Role> & { id?: string }>(
      await req.json(),
    );
    const { id, ...rest } = body;

    if (!id) {
      return fail({ error: "ROLE_UPDATE_BAD_REQUEST" });
    }

    if (!rest.name) {
      return fail({ error: "ROLE_UPDATE_BAD_REQUEST" });
    }

    // ── Validate the role exists ──
    const validResult = await RoleService.find(id);

    if (!validResult.success) {
      return fail({
        error: validResult.error || "ROLE_NOT_FOUND",
      });
    }

    const result = await RoleService.update({ id, ...rest });

    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "ROLE_UPDATE_FAILED" });
  } catch {
    return fail({ error: "ROLE_UPDATE_FAILED" });
  }
});
