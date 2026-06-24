/**
 * CSRF (Cross-Site Request Forgery) Protection
 * Generates and validates tokens for form submissions
 */
import crypto from "crypto";

// In production, store tokens in Redis or database with expiry
const CSRF_TOKEN_STORAGE = new Map();
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Generate a secure CSRF token
 * Should be called for each form request
 */
export function generateCSRFToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const expiry = Date.now() + CSRF_TOKEN_EXPIRY;

  // Store token with expiry
  CSRF_TOKEN_STORAGE.set(token, { expiry });

  // In production, store in Redis:
  // await redis.setex(`csrf:${token}`, 3600, "valid");

  return token;
}

/**
 * Validate CSRF token from request
 * Check that token is valid and not expired
 */
export function validateCSRFToken(token) {
  if (!token) {
    return false;
  }

  const stored = CSRF_TOKEN_STORAGE.get(token);
  if (!stored) {
    return false;
  }

  // Check if token has expired
  if (Date.now() > stored.expiry) {
    CSRF_TOKEN_STORAGE.delete(token);
    return false;
  }

  // Token is valid - optionally delete it (one-time use)
  // CSRF_TOKEN_STORAGE.delete(token);

  return true;
}

/**
 * Clean up expired tokens periodically
 * In production, use Redis expiry instead
 */
export function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of CSRF_TOKEN_STORAGE.entries()) {
    if (now > data.expiry) {
      CSRF_TOKEN_STORAGE.delete(token);
    }
  }
}

/**
 * Middleware to validate CSRF token in POST/PUT/DELETE requests
 */
export function validateCSRFMiddleware(request) {
  // GET requests don't need CSRF protection
  if (request.method === "GET" || request.method === "OPTIONS") {
    return true;
  }

  // Extract CSRF token from request
  // Priority: header → cookie → body
  let token =
    request.headers.get("X-CSRF-Token") ||
    request.headers.get("x-csrf-token");

  if (!token) {
    // Try to get from body (if JSON)
    try {
      const body = request.body;
      if (body && body.csrfToken) {
        token = body.csrfToken;
      }
    } catch (e) {
      // Body parsing failed, token not found
    }
  }

  // Validate token
  return validateCSRFToken(token);
}
