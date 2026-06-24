/**
 * POST /api/auth/logout
 * Admin logout — clears session and cookies.
 *
 * Body: { adminToken }
 * Response: { message: "Logged out successfully" }
 */
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors";
import { logAudit } from "@/lib/audit";

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function POST(request) {
  try {
    const origin = request.headers.get("origin");
    const { adminToken } = await request.json();

    // Validation
    if (!adminToken) {
      const response = Response.json(
        { error: "Admin token required" },
        { status: 400 }
      );
      return applyCORSHeaders(response, origin);
    }

    // In production:
    // - Delete session from Redis: await redis.del(`adminToken:${adminToken}`)
    // - Delete session from database: DELETE FROM admin_sessions WHERE token = ?
    // - Add token to blacklist to prevent reuse

    // Log logout event
    await logAudit({
      entityType: "admin_session",
      entityId: adminToken,
      action: "logout",
      actorType: "admin",
      actorId: "current-admin-id",
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent"),
      newValues: { status: "logged_out" },
    });

    console.log(`[AUTH] Admin logged out: ${adminToken.slice(0, 8)}...`);

    // Create response with cleared cookie
    const response = Response.json(
      {
        message: "Logged out successfully",
        status: "logout_complete",
      },
      {
        status: 200,
        headers: {
          // Clear the adminToken cookie
          "Set-Cookie": `adminToken=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Strict`,
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
