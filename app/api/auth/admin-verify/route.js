/**
 * GET /api/auth/admin-verify
 * Confirms the caller has a valid admin_session cookie.
 *
 * Used by the dashboard on load to gate the UI in agreement with the Edge
 * middleware. Returns { ok: true, adminName } when the signed session cookie
 * is valid, otherwise 401.
 */
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors";
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from "@/lib/adminSession";

function readCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function GET(request) {
  const origin = request.headers.get("origin");
  const token = readCookie(request.headers.get("cookie"), ADMIN_SESSION_COOKIE);
  const session = await verifyAdminSession(token);

  if (!session) {
    return applyCORSHeaders(Response.json({ ok: false }, { status: 401 }), origin);
  }
  return applyCORSHeaders(Response.json({ ok: true, adminName: session.name }), origin);
}
