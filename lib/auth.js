/**
 * Authentication utilities
 * - verifyAdminToken: Verify admin session token
 * - hashPassword: Hash password with bcrypt
 * - verifyPassword: Compare password with hash
 * - generateSessionToken: Generate secure token
 */
import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Verify admin token and return admin info.
 * In production, query Redis or database.
 */
export async function verifyAdminToken(token) {
  if (!token) return null;

  // In production:
  // const session = await Redis.get(`adminToken:${token}`);
  // if (!session || new Date() > session.expiry) return null;
  // return await db.query("SELECT * FROM users WHERE id = ?", [session.adminId]);

  // Mock: Always valid for demo
  return {
    id: 1,
    email: "admin@elperrilatinfood.com",
    name: "Maria Rodriguez",
  };
}

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

/**
 * Verify JWT token (if using JWT strategy).
 * In production, use jsonwebtoken library.
 */
export async function verifyJWT(token, secret) {
  // In production:
  // const decoded = jwt.verify(token, secret);
  // return decoded;

  // Mock: Return token payload
  return { sub: "admin-1", email: "admin@example.com" };
}
