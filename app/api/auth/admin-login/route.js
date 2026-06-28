/**
 * POST /api/auth/admin-login
 * Simple admin auth: username + 4-digit PIN (no 2FA).
 *
 * Credentials come from env (set these in Vercel), with easy defaults:
 *   ADMIN_USERNAME (default "4lexx19")
 *   ADMIN_PIN      (default "3451")
 *   ADMIN_NAME     (default "El Perri")
 *
 * The dashboard is gated behind this login — it's the only way in.
 * For production, override the defaults with strong values in Vercel env.
 *
 * Body: { username, pin }
 * Response: { ok, adminName, adminToken }
 */
import crypto from "crypto";
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors";
import {
  createAdminLoginLimiter,
  checkAndRespond,
  addRateLimitHeaders,
} from "@/lib/rateLimit";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "4lexx19";
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

    const adminToken = crypto.randomBytes(24).toString("hex");
    const response = Response.json(
      { ok: true, adminName: ADMIN_NAME, adminToken },
      { status: 200 }
    );
    return addRateLimitHeaders(applyCORSHeaders(response, origin), rl.rateLimitInfo);
  } catch (error) {
    const response = Response.json({ error: "Error del servidor" }, { status: 500 });
    return applyCORSHeaders(response, origin);
  }
}
