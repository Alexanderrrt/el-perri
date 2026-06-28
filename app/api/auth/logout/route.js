/**
 * POST /api/auth/logout
 * Admin logout — expires the signed admin_session cookie.
 *
 * Body: optional { adminToken } (the cookie is HttpOnly, so the client usually
 * can't supply it). The session cookie is cleared regardless.
 * Response: { message: "Logged out successfully" }
 */
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors";
import { logAudit } from "@/lib/audit";
import { ADMIN_SESSION_COOKIE } from "@/lib/adminSession";

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function POST(request) {
  try {
    const origin = request.headers.get("origin");
    // Body is optional — logout must always clear the session cookie, even if
    // the client can't read the (HttpOnly) token to send it.
    const body = await request.json().catch(() => ({}));

    // Log logout event
    await logAudit({
      entityType: "admin_session",
      entityId: body?.adminToken ? String(body.adminToken).slice(0, 16) : "unknown",
      action: "logout",
      actorType: "admin",
      actorId: "current-admin-id",
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent"),
      newValues: { status: "logged_out" },
    });

    const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";

    // Expire the signed session cookie.
    const response = Response.json(
      {
        message: "Logged out successfully",
        status: "logout_complete",
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": `${ADMIN_SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict;${secure}`,
        },
      }
    );

    return applyCORSHeaders(response, origin);
  } catch (error) {
    console.error("[ERROR] Logout failed:", error);
    const response = Response.json(
      { error: "Logout failed" },
      { status: 500 }
    );
    return applyCORSHeaders(response, request.headers.get("origin"));
  }
}
