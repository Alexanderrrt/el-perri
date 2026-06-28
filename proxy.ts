import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "admin_session";
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours

const encoder = new TextEncoder();

async function verifyToken(token: string | undefined): Promise<boolean> {
  const secret = process.env.ADMIN_TOKEN_SECRET;
  if (!secret || !token) return false;

  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;

  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);

  // Verify HMAC-SHA256 signature
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = Uint8Array.from(
      atob(sig.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
    if (!valid) return false;
  } catch {
    return false;
  }

  // Check expiry — payload format: "username:issuedAt"
  const parts = payload.split(":");
  const issuedAt = parseInt(parts[parts.length - 1], 10);
  if (isNaN(issuedAt) || Date.now() - issuedAt > SESSION_MAX_AGE_MS) return false;

  return true;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedPage = pathname.startsWith("/admin/dashboard");
  const isProtectedApi = pathname.startsWith("/api/admin/");

  if (!isProtectedPage && !isProtectedApi) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = await verifyToken(token);

  if (!valid) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*", "/api/admin/:path*"],
};
