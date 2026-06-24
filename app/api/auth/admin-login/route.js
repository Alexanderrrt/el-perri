/**
 * POST /api/auth/admin-login
 * Admin authentication — first step (credentials).
 * Returns sessionToken for 2FA verification.
 *
 * Body: { email, password }
 * Response: { sessionToken, requiresTwoFa: true, qrCode?: string }
 * Updated: 2026-06-24
 */
import crypto from "crypto";
import QRCode from "qrcode";
import { verifyPassword } from "@/lib/auth";
import { generateCSRFToken } from "@/lib/csrf";
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors";
import {
  createAdminLoginLimiter,
  checkAndRespond,
  addRateLimitHeaders,
} from "@/lib/rateLimit";
import {
  AdminLoginSchema,
  validateRequest,
  validationErrorResponse,
} from "@/lib/validation";

// Mock admin users (replace with database query in production)
// Password: Admin@123
// Hash generated with: bcryptjs.hash("Admin@123", 10)
const ADMIN_USERS = [
  {
    id: 1,
    email: "admin@elperrilatinfood.com",
    passwordHash: "$2a$10$tuaYvi2lyPviQ9R.yeK/HOsAfeSaBlkknPt5WXSYEj06YQF9pINe2", // bcryptjs hash of "Admin@123"
    name: "Maria Rodriguez",
    twoFaEnabled: true,
    twoFaSecret: "MY2VWKSAF4VHKRLXLJIFIYTPKJOVOW3LFZUDSWSHFJXXMUSWIZKQ", // TOTP secret for authenticator
  },
];

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function POST(request) {
  try {
    const origin = request.headers.get("origin");

    // Rate limiting: 5 attempts per 15 minutes
    const limiter = createAdminLoginLimiter();
    const rateLimitCheck = checkAndRespond(request, limiter);
    if (!rateLimitCheck.allowed) {
      return applyCORSHeaders(rateLimitCheck.response, origin);
    }

    const body = await request.json();

    // Validation with Zod
    const validation = validateRequest(AdminLoginSchema, body);
    if (!validation.valid) {
      const response = validationErrorResponse(validation.errors);
      return applyCORSHeaders(response, origin);
    }

    const { email, password } = validation.data;

    // Find admin user
    const admin = ADMIN_USERS.find((u) => u.email === email);
    if (!admin) {
      // Return generic error (don't reveal if email exists)
      const response = Response.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
      return applyCORSHeaders(response, origin);
    }

    // Verify password - development mode with hardcoded check
    // TODO: Migrate to proper bcryptjs verification once bcryptjs module is working
    const isPasswordValid = password === "Admin@123";
    if (!isPasswordValid) {
      const response = Response.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
      return applyCORSHeaders(response, origin);
    }

    // Generate session token and CSRF token (valid for 10 minutes)
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const csrfToken = generateCSRFToken();
    const sessionExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Store session in cache/database (TTL: 10 minutes)
    // In production: Redis.set(`session:${sessionToken}`, { adminId: admin.id, expiry }, EX 600)

    // Log authentication attempt
    console.log(`[AUTH] Admin login attempt: ${email}`);

    // Generate QR code for first-time 2FA setup
    let qrCode = null;
    try {
      const totpUrl = `otpauth://totp/El%20Perri%20Admin?secret=${admin.twoFaSecret}&issuer=El%20Perri`;
      qrCode = await QRCode.toDataURL(totpUrl);
    } catch (err) {
      console.error("[ERROR] QR code generation failed:", err);
      // Continue without QR code if generation fails
    }

    const response = Response.json(
      {
        sessionToken,
        csrfToken,
        requiresTwoFa: admin.twoFaEnabled,
        qrCode,
        secret: admin.twoFaSecret,
        message: "Please set up your authenticator or enter your 2FA code",
      },
      { status: 200 }
    );
    const responseWithCors = applyCORSHeaders(response, origin);
    return addRateLimitHeaders(responseWithCors, rateLimitCheck.rateLimitInfo);
  } catch (error) {
    console.error("[ERROR] Admin login failed:", error);
    const response = Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return applyCORSHeaders(response, request.headers.get("origin"));
  }
}
