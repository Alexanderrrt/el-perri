/**
 * CSRF (Cross-Site Request Forgery) Protection — stateless HMAC approach.
 *
 * Serverless functions on Vercel don't share memory, so in-memory token
 * stores fail across invocations. Instead we sign a timestamp with a
 * server secret (ADMIN_TOKEN_SECRET / CSRF_SECRET). Validation just
 * re-checks the signature — no shared state needed.
 */
import crypto from "crypto";

const SECRET = process.env.ADMIN_TOKEN_SECRET || process.env.CSRF_SECRET || "dev-csrf-fallback-key";
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Generate a CSRF token: base64(timestamp.hmac)
 */
export function generateCSRFToken() {
  const timestamp = Date.now().toString();
  const sig = crypto.createHmac("sha256", SECRET).update(timestamp).digest("hex");
  return Buffer.from(`${timestamp}.${sig}`).toString("base64");
}

/**
 * Validate a CSRF token: decode, verify HMAC, check expiry.
 */
export function validateCSRFToken(token) {
  if (!token) return false;

  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [timestamp, sig] = decoded.split(".");
    if (!timestamp || !sig) return false;

    const expected = crypto.createHmac("sha256", SECRET).update(timestamp).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;

    if (Date.now() - parseInt(timestamp, 10) > TOKEN_EXPIRY) return false;

    return true;
  } catch {
    return false;
  }
}
