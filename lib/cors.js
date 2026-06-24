/**
 * CORS (Cross-Origin Resource Sharing) middleware
 * Prevents API access from unauthorized origins
 */

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://elperrilatinfood.com",
  "https://www.elperrilatinfood.com",
  "https://admin.elperrilatinfood.com",
];

/**
 * Apply CORS headers to response
 * Restricts API access to allowed origins only
 */
export function applyCORSHeaders(response, origin) {
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-CSRF-Token"
    );
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours
  }

  return response;
}

/**
 * Handle OPTIONS preflight requests for CORS
 */
export function handleCORSPreflight(origin) {
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

  if (!isAllowedOrigin) {
    return new Response("CORS policy violation", { status: 403 });
  }

  const response = new Response(null, { status: 200 });
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-CSRF-Token"
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}

/**
 * Middleware wrapper for API routes
 * Usage: return apiHandler(request, response, handler)
 */
export async function apiHandler(request, response, handler) {
  const origin = request.headers.get("origin");

  // Handle OPTIONS preflight
  if (request.method === "OPTIONS") {
    return handleCORSPreflight(origin);
  }

  // Call handler
  const result = await handler();

  // Apply CORS headers to response
  return applyCORSHeaders(result, origin);
}
