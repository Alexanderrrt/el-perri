/**
 * POST /api/auth/admin-login
 * Simple admin auth: username + 4-digit PIN (no 2FA).
 *
 * Credentials come from env (set these in Vercel), with defaults:
 *   ADMIN_USERNAME (default "4lex19")
 *   ADMIN_PIN      (default "3451")
 *   ADMIN_NAME     (default "El Perri")
 *
 * Body: { username, pin }
 * Response: { ok, adminName, adminToken }
 */
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors";
import {
  createAdminLoginLimiter,
  checkAndRespond,
  addRateLimitHeaders,
} from "@/lib/rateLimit";
import {
  signAdminSession,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_MS,
} from "@/lib/adminSession";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "4lex19";
const ADMIN_PIN = process.env.ADMIN_PIN || "3451";
const ADMIN_NAME = process.env.ADMIN_NAME || "El Perri";

export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function POST(request) {
  const origin = request.headers.get("origin");
  try {
    // Rate limit to slow down PIN brute-force (5 tries / 15 min)
    const limiter = createAdminLoginLimiter();
    const rl = checkAndRespond(request, limiter);
    if (!rl.allowed) return applyCORSHeaders(rl.response, origin);

    const { username, pin } = await request.json();

    const ok =
      username &&
      pin &&
      String(username).trim().toLowerCase() === ADMIN_USERNAME.toLowerCase() &&
      String(pin) === String(ADMIN_PIN);

    if (!ok) {
      const response = Response.json({ error: "Usuario o PIN incorrecto" }, { status: 401 });
      return applyCORSHeaders(response, origin);
    }

    // Issue a signed, self-expiring session and set it as an HttpOnly cookie.
    // The cookie — not the returned token — is what the middleware enforces.
    const exp = Date.now() + ADMIN_SESSION_TTL_MS;
    const adminToken = await signAdminSession({ u: ADMIN_USERNAME, name: ADMIN_NAME, exp });
    const maxAge = Math.floor(ADMIN_SESSION_TTL_MS / 1000);
    const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";

    const response = Response.json(
      { ok: true, adminName: ADMIN_NAME, adminToken },
      {
        status: 200,
        headers: {
          "Set-Cookie": `${ADMIN_SESSION_COOKIE}=${adminToken}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Strict;${secure}`,
        },
      }
    );
    return addRateLimitHeaders(applyCORSHeaders(response, origin), rl.rateLimitInfo);
  } catch (error) {
    const response = Response.json({ error: "Error del servidor" }, { status: 500 });
    return applyCORSHeaders(response, origin);
  }
}
