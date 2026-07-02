/**
 * Rate Limiting Middleware
 * Prevents brute-force attacks on authentication endpoints
 */

// In-memory store for rate limit tracking
// In production, use Redis for distributed rate limiting
const rateLimitStore = new Map();
const CLEANUP_INTERVAL = 60 * 1000; // Clean up expired entries every minute

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Check if request should be rate limited
 * Returns: { allowed: boolean, remaining: number, resetTime: number }
 */
function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const data = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };

  if (now > data.resetTime) {
    // Window has expired, reset counter
    data.count = 1;
    data.resetTime = now + windowMs;
  } else {
    // Within current window
    data.count += 1;
  }

  rateLimitStore.set(key, data);

  const allowed = data.count <= limit;
  const remaining = Math.max(0, limit - data.count);

  return {
    allowed,
    count: data.count,
    limit,
    remaining,
    resetTime: data.resetTime,
    retryAfter: Math.ceil((data.resetTime - now) / 1000), // seconds
  };
}

/**
 * Rate limiter for admin login endpoint
 * 5 attempts per 15 minutes per IP
 */
export function createAdminLoginLimiter() {
  return (request) => {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const key = `admin-login:${ip}`;
    return checkRateLimit(key, 5, 15 * 60 * 1000);
  };
}

/**
 * Rate limiter for 2FA verification
 * 3 attempts per 5 minutes per IP
 */
export function create2FALimiter() {
  return (request) => {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const key = `2fa-verify:${ip}`;
    return checkRateLimit(key, 3, 5 * 60 * 1000);
  };
}

/**
 * Rate limiter for guest checkout
 * 100 requests per hour per IP
 */
export function createCheckoutLimiter() {
  return (request) => {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const key = `checkout:${ip}`;
    return checkRateLimit(key, 100, 60 * 60 * 1000);
  };
}

/**
 * Rate limiter for public lead forms (catering quotes)
 * 10 submissions per hour per IP
 */
export function createLeadLimiter() {
  return (request) => {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const key = `lead:${ip}`;
    return checkRateLimit(key, 10, 60 * 60 * 1000);
  };
}

/**
 * Rate limiter for API endpoints (generic)
 * 1000 requests per hour per IP
 */
export function createGenericLimiter() {
  return (request) => {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const key = `api:${ip}`;
    return checkRateLimit(key, 1000, 60 * 60 * 1000);
  };
}

/**
 * Create response with rate limit headers
 */
export function addRateLimitHeaders(response, rateLimitInfo) {
  response.headers.set("X-RateLimit-Limit", String(rateLimitInfo.limit));
  response.headers.set(
    "X-RateLimit-Remaining",
    String(rateLimitInfo.remaining)
  );
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.floor(rateLimitInfo.resetTime / 1000))
  );
  response.headers.set(
    "Retry-After",
    String(rateLimitInfo.retryAfter)
  );
  return response;
}

/**
 * Check rate limit and return 429 if exceeded
 */
export function checkAndRespond(request, limiter) {
  const rateLimitInfo = limiter(request);

  if (!rateLimitInfo.allowed) {
    const response = Response.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter: rateLimitInfo.retryAfter,
      },
      { status: 429 }
    );
    return {
      allowed: false,
      response: addRateLimitHeaders(response, rateLimitInfo),
    };
  }

  return {
    allowed: true,
    rateLimitInfo,
  };
}
