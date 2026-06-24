/**
 * GET /api/csrf-token
 * Generate and return a CSRF token for form submissions
 *
 * Response: { csrfToken: "..." }
 */
import { generateCSRFToken } from "@/lib/csrf";
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors";

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function GET(request) {
  try {
    const origin = request.headers.get("origin");

    // Generate CSRF token
    const csrfToken = generateCSRFToken();

    const response = Response.json(
      {
        csrfToken,
        message: "CSRF token generated successfully",
      },
      { status: 200 }
    );

    return applyCORSHeaders(response, origin);
  } catch (error) {
    console.error("[ERROR] CSRF token generation failed:", error);
    const response = Response.json(
      { error: "Failed to generate CSRF token" },
      { status: 500 }
    );
    return applyCORSHeaders(response, request.headers.get("origin"));
  }
}
