import { withAuth } from "@/lib/api/auth-middleware";
import { ok, fail } from "@/lib/api/api-response";
import { AuthSessionService } from "@/services/auth-sessions.service";

/**
 * GET /api/auth/sessions
 * List all sessions for the authenticated user.
 */
export const GET = withAuth()(async ({ user }) => {
  try {
    const result = await AuthSessionService.listSessions(user.profile);
    if (result.success) {
      return ok({ data: result.data });
    }
    return fail({ error: result.error || "Failed to fetch sessions" });
  } catch (err) {
    return fail({
      error: (err as Error).message || "Failed to fetch sessions",
    });
  }
});

/**
 * DELETE /api/auth/sessions
 * Revoke a specific session or all other sessions.
 * Query parameter `id` designates the session to delete.
 * If query parameter `revoke_others=true` is present, it revokes all sessions except the current one.
 */
export const DELETE = withAuth()(async ({ req, user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const revokeOthers = searchParams.get("revoke_others") === "true";

    if (revokeOthers) {
      if (!user.session) {
        return fail({
          error: "Current session ID is missing",
          statusCode: 400,
        });
      }
      const result = await AuthSessionService.revokeAllOtherSessions(
        user.session,
        user.profile,
      );
      if (result.success) {
        return ok({ message: "All other sessions revoked successfully" });
      }
      return fail({ error: result.error || "Failed to revoke other sessions" });
    }

    if (!id) {
      return fail({ error: "Session ID is required", statusCode: 400 });
    }

    const result = await AuthSessionService.revokeSession(id, user.profile);
    if (result.success) {
      return ok({ message: "Session revoked successfully" });
    }
    return fail({ error: result.error || "Failed to revoke session" });
  } catch (err) {
    return fail({
      error: (err as Error).message || "Failed to revoke session",
    });
  }
});
