import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { jt } from "@/config/env.config";
import type { JwtPayload } from "@/types/business/user.types";

const encoder = new TextEncoder();

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
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
