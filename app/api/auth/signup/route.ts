import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api/api-response";
import { AuthService } from "@/services/auth.service";
import { ProfileService } from "@/services/profile.service";
import { signJwt } from "@/lib/api/jwt.helper";
import { JwtPayload } from "@/types/business/user.types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, username } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return fail({ error: "Email, password, and name are required" });
    }

    // Step 1: Create the user in Supabase Auth
    const authResult = await AuthService.signUp(email, password);

    if (!authResult.success) {
      return fail({ error: authResult.error });
    }

    // Step 2: Create the profile linked to the auth user
    const profileResult = await ProfileService.create({
      user: authResult.data.user.id,
      email,
      name,
      username,
    });

    if (!profileResult.success) {
      // Profile creation failed — clean up the auth user
      await AuthService.deleteUser(authResult.data.user.id);

      return fail({
        error: profileResult.error,
        statusCode: 500,
      });
    }

    const { data: profile } = profileResult;
    const jwtPayload: JwtPayload = {
      profile: profile.id,
      email: profile.email,
      role: profile.role,
    };

    const token = await signJwt(jwtPayload);

    return ok({
      data: {
        user: profile,
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
