import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api/api-response";
import { AuthService } from "@/services/auth.service";
import { signJwt } from "@/lib/api/jwt.helper";
import type { JwtPayload } from "@/types/business/user.types";
import { AuthSessionService } from "@/services/auth-sessions.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return fail({ error: "Email, password, and name are required" });
    }

    // Create the user profile directly with Argon2 hashing
    const signUpResult = await AuthService.signUp(email, password, name);

    if (!signUpResult.success) {
      return fail({ error: signUpResult.error });
    }

    const user = signUpResult.data.user;
    const roleStr =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof user.role === "string" ? user.role : (user.role as any)?.id || "";

    // Parse user agent and metadata using AuthSessionService helper
    const metadata = await AuthSessionService.extractSessionMetadata(request);

    // Create session in database
    const sessionResult = await AuthSessionService.createSession(
      user.id,
      metadata,
    );
    if (!sessionResult.success) {
      return fail({ error: sessionResult.error || "Failed to create session" });
    }

    const session = sessionResult.data;

    // Sign JWT token using the session ID and email
    const jwtPayload: JwtPayload = {
      session: session.id,
      email: user.email,
    };

    const token = await signJwt(jwtPayload);

    return ok({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: roleStr,
        },
        token,
      },
      message: "User created successfully",
      statusCode: 201,
    });
  } catch (err) {
    return fail({
      error: (err as Error).message || "An unknown error occurred",
      statusCode: 500,
    });
  }
}
