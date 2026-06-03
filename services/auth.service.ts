import { getSupabaseServerClient } from "@/lib/api/supabase";
import { success, error } from "@/lib/api/api-response";
import { signJwt } from "@/lib/api/jwt.helper";
import type { JwtPayload, LoginParams } from "@/types/business/user.types";
import type { Profile } from "@/types/db/profile.types";

export class AuthService {
  /**
   * Creates a new user in Supabase Auth using email and password.
   * Returns the created user on success.
   */
  static async signUp(email: string, password: string) {
    try {
      const supabase = getSupabaseServerClient();

      const { data, error: sbError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (sbError) {
        return error(sbError.message);
      }

      if (!data.user) {
        return error("Failed to create user");
      }

      return success({ user: data.user });
    } catch (err) {
      return error((err as Error).message || "An unknown error occurred");
    }
  }

  /**
   * Delete a user from Supabase Auth by user ID.
   * Used for cleanup when profile creation fails after user creation.
   */
  static async deleteUser(userId: string) {
    try {
      const supabase = getSupabaseServerClient();

      const { error: sbError } = await supabase.auth.admin.deleteUser(userId);

      if (sbError) {
        return error(sbError.message);
      }

      return success(undefined);
    } catch (err) {
      return error((err as Error).message || "An unknown error occurred");
    }
  }

  /**
   * Authenticate a user with email and password.
   * Returns a JWT token and user profile data on success.
   */
  static async login(params: LoginParams) {
    try {
      const supabase = getSupabaseServerClient();

      // Sign in with email and password using the admin API
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email: params.email,
        password: params.password,
      });

      if (sbError) {
        return error(sbError.message);
      }

      if (!data.user) {
        return error("Invalid email or password");
      }

      // Fetch the profile linked to this user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileData, error: profileError } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("user", data.user.id)
        .single();

      if (profileError || !profileData) {
        return error("User profile not found");
      }

      const profile = profileData as Profile;

      // Sign JWT token
      const jwtPayload: JwtPayload = {
        profile: profile.id,
        email: profile.email,
        role: profile.role,
      };

      const token = await signJwt(jwtPayload);

      return success({
        token,
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          username: profile.username,
          role: profile.role,
        },
      });
    } catch (err) {
      return error((err as Error).message || "An unknown error occurred");
    }
  }
}
