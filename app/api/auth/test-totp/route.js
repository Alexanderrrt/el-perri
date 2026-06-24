/**
 * POST /api/auth/test-totp
 * Generate a valid TOTP code for testing (dev only)
 */
import speakeasy from "speakeasy";

export async function POST(request) {
  try {
    const { secret } = await request.json();

    if (!secret) {
      return Response.json(
        { error: "Secret required" },
        { status: 400 }
      );
    }

    // Generate a valid TOTP code for the secret
    const token = speakeasy.totp({
      secret: secret,
      encoding: "base32",
    });

    return Response.json(
      {
        code: token,
        secret: secret,
        message: "Valid TOTP code for testing",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] TOTP generation failed:", error);
    return Response.json(
      { error: "Failed to generate TOTP code", details: error.message },
      { status: 500 }
    );
  }
}
