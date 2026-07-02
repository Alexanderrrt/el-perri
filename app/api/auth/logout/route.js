/**
 * POST /api/auth/logout
 * Clears the admin_session cookie. No body required.
 */
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors";

export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function POST(request) {
  const origin = request.headers.get("origin");
  const response = new Response(
    JSON.stringify({ message: "Logged out successfully" }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "admin_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict",
      },
    }
  );
  return applyCORSHeaders(response, origin);
}
