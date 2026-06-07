import { withAuth } from "@/lib/api/auth-middleware";
import { ProfileService } from "@/services/profile.service";
import { AuthSessionService } from "@/services/auth-sessions.service";
import { fail, ok } from "@/lib/api/api-response";

/**
 * GET /api/auth/me
 *
 * Protected route — returns the authenticated user's profile data
 * along with the role's permissions and accessible pages.
 *
 * The JWT token is verified by `withAuth`, and the decoded payload
 * (which contains the profile ID) is passed to the handler.
 *
 * Checks if the account is active; returns a specific error if not.
 */
export const GET = withAuth()(async ({ user }) => {
  try {
    if (!user.session) {
      return fail({ error: "Session ID not found in token", statusCode: 401 });
    }

    // Query session to check validity and expiry
    const sessionResult = await AuthSessionService.validateAndGetSession(user.session);
    if (!sessionResult.success) {
      return fail({ error: sessionResult.error, statusCode: 401 });
    }

    const result = await ProfileService.getById(user.profile);

    if (!result.success) {
      return fail({ error: result.error, statusCode: 404 });
    }

    // Check if the account is active
    if (result.data.active === false) {
      return fail({
        error: "Account is inactive or suspended",
        errorType: "PROFILE_INACTIVE",
        statusCode: 403,
      });
    }

    // Extract permissions & pages from the nested role object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleData = result.data.role as any;
    const permissions: string[] =
      roleData?.permissions?.map((p: { name: string }) => p.name) ?? [];
    const pages: string[] =
      roleData?.pages?.map((p: { url: string }) => p.url) ?? [];

    // Safely extract landing_page — strip any accidental extra quotes
    let landingPage = roleData?.landing_page;
    if (typeof landingPage === "string") {
      landingPage = landingPage.replace(/^"+|"+$/g, "");
    }

    return ok({
      data: {
        ...result.data,
        currentSessionId: user.session,
        role: {
          id: roleData?.id as string,
          name: roleData?.name as string,
          landing_page: landingPage,
        },
        permissions,
        pages,
      },
    });
  } catch (err) {
    return fail({
      error: (err as Error).message || "Failed to fetch profile",
      statusCode: 500,
    });
  }
});
