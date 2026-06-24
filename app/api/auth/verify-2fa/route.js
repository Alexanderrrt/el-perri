/**
 * POST /api/auth/verify-2fa
 * Verify 2FA code and issue admin token.
 *
 * Body: { sessionToken, twoFaCode, trustDevice, csrfToken }
 * Response: { adminToken, refreshToken, adminName }
 */
import crypto from "crypto";
import speakeasy from "speakeasy"; // npm install speakeasy
import { validateCSRFToken } from "@/lib/csrf"; // CSRF protection
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors"; // CORS
import {
  create2FALimiter,
  checkAndRespond,
  addRateLimitHeaders,
} from "@/lib/rateLimit"; // Rate limiting
import {
  Verify2FASchema,
  validateRequest,
  validationErrorResponse,
} from "@/lib/validation"; // Input validation
import {
  isSessionLocked,
  getLockoutInfo,
  recordFailedAttempt,
  clearAttempts,
} from "@/lib/2fa"; // 2FA lockout protection

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function POST(request) {
  try {
    const origin = request.headers.get("origin");

    // Rate limiting: 3 attempts per 5 minutes
    const limiter = create2FALimiter();
    const rateLimitCheck = checkAndRespond(request, limiter);
    if (!rateLimitCheck.allowed) {
      return applyCORSHeaders(rateLimitCheck.response, origin);
    }

    const body = await request.json();

    // Validation with Zod
    const validation = validateRequest(Verify2FASchema, body);
    if (!validation.valid) {
      const response = validationErrorResponse(validation.errors);
      return applyCORSHeaders(response, origin);
    }

    const { sessionToken, twoFaCode, trustDevice, csrfToken } = validation.data;

    // Validate CSRF token
    if (!validateCSRFToken(csrfToken)) {
      const response = Response.json(
        { error: "Invalid or missing CSRF token" },
        { status: 403 }
      );
      return applyCORSHeaders(response, origin);
    }

    // Check if session is locked due to too many failed attempts
    if (isSessionLocked(sessionToken)) {
      const lockoutInfo = getLockoutInfo(sessionToken);
      const response = Response.json(
        {
          error: "Too many failed attempts. Please try again later.",
          retryAfter: lockoutInfo.retryAfterSeconds,
        },
        { status: 429 }
      );
      response.headers.set(
        "Retry-After",
        String(lockoutInfo.retryAfterSeconds)
      );
      return applyCORSHeaders(response, origin);
    }

    // Verify session exists (in production, check Redis)
    // const session = await Redis.get(`session:${sessionToken}`);
    // if (!session || new Date() > session.expiry) { ... }

    // Mock: Get admin and their 2FA secret (must match admin-login route)
    const admin = {
      id: 1,
      email: "admin@elperrilatinfood.com",
      name: "Maria Rodriguez",
      twoFaSecret: "MY2VWKSAF4VHKRLXLJIFIYTPKJOVOW3LFZUDSWSHFJXXMUSWIZKQ",
    };

    // Verify TOTP code (Time-based One-Time Password)
    // Window: 1 means accept only current time window (-1 to +1, total 30 sec window)
    // This is more secure than window: 2
    const verified = speakeasy.totp.verify({
      secret: admin.twoFaSecret,
      encoding: "base32",
      token: twoFaCode,
      window: 1, // Stricter: only accept current + previous/next 30-second window
    });

    if (!verified) {
      // Track failed attempt
      const attemptInfo = recordFailedAttempt(sessionToken);

      console.log(
        `[AUTH] Invalid 2FA code for admin: ${admin.email} (attempt ${attemptInfo.count}/${3})`
      );

      const response = Response.json(
        {
          error: "Invalid 2FA code",
          remainingAttempts: attemptInfo.remainingAttempts,
          locked: attemptInfo.locked,
        },
        { status: 401 }
      );
      return applyCORSHeaders(response, origin);
    }

    // 2FA verification successful - clear failed attempts
    clearAttempts(sessionToken);

    // Generate admin token (valid for 8 hours)
    const adminToken = crypto.randomBytes(32).toString("hex");
    const refreshToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 8 * 60 * 60 * 1000);

    // Store admin session
    // In production: Redis.set(`adminToken:${adminToken}`, { adminId: admin.id, expiry }, EX 28800)
    //               Redis.set(`refreshToken:${refreshToken}`, { adminId: admin.id, expiry }, EX 604800)

    // If trustDevice: set longer-lived device cookie (30 days)
    const deviceCookie = trustDevice
      ? `; Max-Age=${30 * 24 * 60 * 60}; Secure; HttpOnly; SameSite=Strict`
      : `; Secure; HttpOnly; SameSite=Strict`;

    console.log(`[AUTH] ✅ Admin 2FA verified: ${admin.email}`);

    const response = Response.json(
      {
        adminToken,
        refreshToken,
        adminName: admin.name,
        tokenExpiry,
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": `adminToken=${adminToken}${deviceCookie}`,
        },
      }
    );
    const responseWithCors = applyCORSHeaders(response, origin);
    return addRateLimitHeaders(responseWithCors, rateLimitCheck.rateLimitInfo);
  } catch (error) {
    console.error("[ERROR] 2FA verification failed:", error);
    const response = Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return applyCORSHeaders(response, request.headers.get("origin"));
  }
}
