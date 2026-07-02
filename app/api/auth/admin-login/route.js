/**
 * POST /api/auth/admin-login
 * Verifies username + PIN, issues a signed HttpOnly session cookie.
 *
 * Required env vars (set in Vercel + .env.local):
 *   ADMIN_USERNAME       — the only allowed username
 *   ADMIN_PIN            — 4-digit PIN
 *   ADMIN_NAME           — display name returned to client
 *   ADMIN_TOKEN_SECRET   — secret for HMAC-SHA256 cookie signing
 *
 * Body: { username, pin }
 * Response: { ok, adminName }  — token is in the HttpOnly cookie, not the body
 */
import crypto from "crypto";
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors";
import { createAdminLoginLimiter, checkAndRespond, addRateLimitHeaders } from "@/lib/rateLimit";

const SESSION_COOKIE = "admin_session";
const SESSION_MAX_AGE_S = 8 * 60 * 60; // 8 hours

function buildToken(username) {
  const secret = process.env.ADMIN_TOKEN_SECRET;
  const payload = `${username}:${Date.now()}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function POST(request) {
  const origin = request.headers.get("origin");
  try {
    const limiter = createAdminLoginLimiter();
    const rl = checkAndRespond(request, limiter);
    if (!rl.allowed) return applyCORSHeaders(rl.response, origin);

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
    const ADMIN_PIN = process.env.ADMIN_PIN;
    const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET;

    if (!ADMIN_USERNAME || !ADMIN_PIN || !ADMIN_TOKEN_SECRET) {
      return applyCORSHeaders(
        Response.json(
          { error: "Admin no configurado: define ADMIN_USERNAME, ADMIN_PIN y ADMIN_TOKEN_SECRET." },
          { status: 503 }
        ),
        origin
      );
    }

    const body = await request.json();
    const username = String(body.username ?? "").trim();
    const pin = String(body.pin ?? "");

    const ok =
      username &&
      pin &&
      username.toLowerCase() === ADMIN_USERNAME.toLowerCase() &&
      pin === String(ADMIN_PIN);

    if (!ok) {
      return applyCORSHeaders(
        Response.json({ error: "Usuario o PIN incorrecto" }, { status: 401 }),
        origin
      );
    }

    const token = buildToken(username);
    const isSecure = (origin ?? "").startsWith("https");
    const cookieFlags = [
      `${SESSION_COOKIE}=${token}`,
      `Max-Age=${SESSION_MAX_AGE_S}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Strict",
      ...(isSecure ? ["Secure"] : []),
    ].join("; ");

    const response = new Response(
      JSON.stringify({ ok: true, adminName: process.env.ADMIN_NAME || "El Perri Admin" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookieFlags,
        },
      }
    );
    return addRateLimitHeaders(applyCORSHeaders(response, origin), rl.rateLimitInfo);
  } catch {
    return applyCORSHeaders(
      Response.json({ error: "Error del servidor" }, { status: 500 }),
      origin
    );
  }
}
