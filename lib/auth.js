/**
 * Authentication utilities
 * - hashPassword: Hash password with bcrypt
 * - verifyPassword: Compare password with hash
 * - generateSessionToken: Generate secure token
 *
 * Admin session verification lives in proxy.ts (HMAC-signed cookie).
 */
import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Hash password using bcrypt.
 * Generates salt with 10 rounds for security.
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Verify password against hash using bcrypt.
 * Constant-time comparison prevents timing attacks.
 */
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a secure random token.
 */
export function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Extract token from Authorization header.
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}
