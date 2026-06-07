import { success, error } from "@/lib/api/api-response";
import { signJwt } from "@/lib/api/jwt.helper";
import { hashPassword, verifyPassword } from "@/lib/api/argon2.helper";
import type { JwtPayload, LoginParams } from "@/types/business/user.types";
import { ProfileService } from "./profile.service";
import { AuthSessionService } from "./auth-sessions.service";
import type { AuthSessionFormData } from "@/types/db/auth-session.types";

export class AuthService {
  /**
   * Creates a new user profile with hashed password.
   */
  static async signUp(email: string, password: string, name: string) {
    try {
      const hashedPassword = await hashPassword(password);
      const profileResult = await ProfileService.create({
        email,
        name,
        password: hashedPassword,
      });

      if (!profileResult.success) {
        return error(profileResult.error);
      }

      return success({ user: profileResult.data });
    } catch (err) {
      return error((err as Error).message || "An unknown error occurred");
    }
  }

  /**
   * Authenticate a user with email and password.
   * Returns a JWT token and user profile data on success.
   */
  static async login(
    params: LoginParams,
    metadata: Partial<AuthSessionFormData> = {},
  ) {
    try {
      // Use ProfileService instead of querying profile table directly
      const profileResult = await ProfileService.getByEmailWithPassword(
        params.email,
      );

      if (!profileResult.success) {
        return error("Invalid email or password");
      }

      const profile = profileResult.data;

      if (!profile.active) {
        return error("Account is inactive or suspended");
      }

      if (!profile.password) {
        return error(
          "Authentication failed. No password set for this account.",
        );
      }

      // Validate password
      const isValid = await verifyPassword(profile.password, params.password);
      if (!isValid) {
        return error("Invalid email or password");
      }

      // Create new session in auth_sessions table
      const sessionResult = await AuthSessionService.createSession(profile.id, {
        ...metadata,
        auth_method: "password",
      });

      if (!sessionResult.success) {
        return error(sessionResult.error || "Failed to create session");
      }

      const session = sessionResult.data;

      // Sign JWT token using the session ID and email
      const jwtPayload: JwtPayload = {
        session: session.id,
        email: profile.email,
      };

      const token = await signJwt(jwtPayload);

      const roleStr =
        typeof profile.role === "string"
          ? profile.role
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (profile.role as any)?.id || "";

      return success({
        token,
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: roleStr,
        },
      });
    } catch (err) {
      return error((err as Error).message || "An unknown error occurred");
    }
  }
}
