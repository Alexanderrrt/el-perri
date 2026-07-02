/**
 * GET /api/promotions            -> list active, non-expired promotions
 * GET /api/promotions?code=XXX   -> validate a single promo code
 *
 * Public, read-only endpoint (NOT under /api/admin, so it isn't behind the
 * admin session gate in proxy.ts). The guest checkout calls this to validate
 * promo codes. Admin-managed CRUD stays under /api/admin/promotions.
 * Backed by the Supabase `promotions` table via lib/promotionsStore.
 */
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors";
import { listActivePromotions, findActivePromo } from "@/lib/promotionsStore";

export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function GET(request) {
  const origin = request.headers.get("origin");
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const promo = await findActivePromo(code);
    if (!promo) {
      return applyCORSHeaders(
        Response.json({ success: false, error: "Invalid or expired code" }, { status: 404 }),
        origin
      );
    }
    return applyCORSHeaders(Response.json({ success: true, promo }), origin);
  }

  const promotions = await listActivePromotions();
  return applyCORSHeaders(Response.json({ success: true, promotions }), origin);
}
