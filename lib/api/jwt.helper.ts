import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { jt } from "@/config/env.config";
import type { JwtPayload } from "@/types/business/user.types";
import { AuthCondition, JwtVerifyResult } from "@/types/business/auth.types";
import { ProfileService } from "@/services/profile.service";

const encoder = new TextEncoder();

function resolveScope(
  userPermissions: string[],
  whitelist: string[],
): { granted: boolean; conditions: AuthCondition } {
  const userPermissionSet = new Set(userPermissions);
  const conditions: AuthCondition = {
    own: false,
    all: false,
    assigned: false,
  };

  let granted = false;
  let hasBase = false;

  for (const permission of whitelist) {
    if (!userPermissionSet.has(permission)) continue;

    granted = true;

    if (permission.endsWith(":all")) {
      conditions.all = true;
      continue;
    }

    if (permission.endsWith(":own")) {
      conditions.own = true;
      continue;
    }

    if (permission.endsWith(":assigned")) {
      conditions.assigned = true;
      continue;
    }

    hasBase = true;
  }

  if (!granted) return { granted: false, conditions: {} };

  if (conditions.all) {
    conditions.own = false;
  } else if (hasBase) {
    conditions.own = false;
  }

  return { granted: true, conditions };
}

function getSecret(): Uint8Array {
  const secret = jt.secretKey;
  if (!secret) {
    throw new Error("JWT_SECRET_KEY is not defined in environment variables");
  }
  return encoder.encode(secret);
}

/**
 * Sign a JWT token with the given payload.
 * Uses HS256 algorithm and the configured expiry time.
 */
export async function signJwt(payload: JwtPayload): Promise<string> {
  const secret = getSecret();

  const token = await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(jt.expiresIn)
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT token.
 * Returns the payload if valid, or null if invalid/expired.
 */
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    return payload as unknown as JwtPayload;
  } catch (err) {
    console.error("[JWT] Token verification failed:", err);
    return null;
  }
}

/**
 * Verify JWT token — validates signature, checks profile status, and
 * resolves permission scope (isOwn, etc.) against the supplied whitelist.
 */
export async function verifyToken(
  token: string,
  permissions?: string | string[],
): Promise<JwtVerifyResult> {
  try {
    const decoded = await verifyJwt(token);

    if (!decoded) {
      return {
        valid: false,
        error:
          "Token verification failed. The token may be expired or invalid.",
        errorType: "INVALID_TOKEN",
      };
    }

    if (!decoded.profile || typeof decoded.email !== "string") {
      console.error("[JWT] Token payload missing required fields:", {
        hasProfile: !!decoded.profile,
        emailType: typeof decoded.email,
      });
      return {
        valid: false,
        error: "Invalid token payload",
        errorType: "INVALID_TOKEN",
      };
    }

    // Normalise to array (support comma-separated string for convenience)
    const permList: string[] =
      !permissions || permissions === ""
        ? []
        : Array.isArray(permissions)
          ? permissions
          : permissions
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean);

    // No permission required — return early (profile status NOT checked)
    if (permList.length === 0) {
      return {
        valid: true,
        user: {
          profile: decoded.profile,
          email: decoded.email,
          role: decoded.role || "",
        },
      };
    }

    // Fetch profile with role + permissions in a single DB call
    const profileResult = await ProfileService.permissions(decoded.profile);

    if (!profileResult.success) {
      return {
        valid: false,
        error: profileResult.error || "Profile not found",
        errorType: "PERMISSION_DENIED",
      };
    }

    if (!profileResult.data) {
      return {
        valid: false,
        error: "Profile data not found",
        errorType: "PERMISSION_DENIED",
      };
    }

    // Check profile status
    if (!profileResult.data.active) {
      return {
        valid: false,
        error: "Account is inactive or suspended",
        errorType: "PROFILE_INACTIVE",
      };
    }

    // Resolve scope against the whitelist
    const scope = resolveScope(profileResult.data.permissions, permList);

    if (!scope.granted) {
      return {
        valid: false,
        error: `User does not have permission: ${permList.join(" | ")}`,
        errorType: "PERMISSION_DENIED",
      };
    }

    return {
      valid: true,
      conditions: scope.conditions,
      user: {
        profile: decoded.profile,
        email: decoded.email,
        role: profileResult.data.roleId,
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Invalid token";
    const isExpired =
      errorMessage.includes("expired") || errorMessage.includes("jwt expired");

    return {
      valid: false,
      error: errorMessage,
      errorType: isExpired ? "INVALID_TOKEN" : "AUTH_ERROR",
    };
  }
}
