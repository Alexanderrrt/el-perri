/**
 * GET /api/promotions            -> list active, non-expired promotions
 * GET /api/promotions?code=XXX   -> validate a single promo code
 *
 * Public, read-only endpoint (NOT under /api/admin, so it isn't behind the
 * admin session gate in proxy.ts). The guest checkout calls this to validate
 * promo codes. Admin-managed CRUD stays under /api/admin/promotions.
 */
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors";

// Active promotions. (Admin-managed persistence to Supabase is a follow-up;
// these are the codes currently advertised in the checkout UI.)
const PROMOTIONS = [
  { id: "welcome", code: "WELCOME", type: "percent", discount: 10, description: "10% off first order", expiry: "2026-12-31", active: true },
  { id: "friends", code: "FRIENDS", type: "fixed", discount: 5, description: "$5 off orders over $25", expiry: "2026-12-31", active: true },
];

const isLive = (p) => p.active && new Date(p.expiry) > new Date();

export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function GET(request) {
  const origin = request.headers.get("origin");
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const promo = PROMOTIONS.find(
      (p) => p.code.toUpperCase() === code.trim().toUpperCase() && isLive(p)
    );
    if (!promo) {
      return applyCORSHeaders(
        Response.json({ success: false, error: "Invalid or expired code" }, { status: 404 }),
        origin
      );
    }
    return applyCORSHeaders(Response.json({ success: true, promo }), origin);
  }

  return applyCORSHeaders(
    Response.json({ success: true, promotions: PROMOTIONS.filter(isLive) }),
    origin
  );
}
