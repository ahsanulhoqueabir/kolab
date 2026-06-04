import argon2 from "argon2";

/**
 * Hashes a plain-text password using Argon2.
 */
export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

/**
 * Verifies a plain-text password against a stored Argon2 hash.
 */
export async function verifyPassword(hashed: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hashed, plain);
  } catch {
    return false;
  }
}
