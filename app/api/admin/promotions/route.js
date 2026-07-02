/**
 * Admin promotions CRUD — persists to the Supabase `promotions` table
 * (service-role client) so promos survive restarts and show up in the
 * public /api/promotions endpoint immediately. Falls back to an in-memory
 * list when Supabase env vars are absent (local dev without keys).
 * Admin session enforcement happens in proxy.ts for all /api/admin routes.
 *
 * GET               -> all promotions (including inactive/expired)
 * GET?code=XXX      -> validate one active code
 * POST              -> create { code, type, discount, description, expiry, active }
 * PUT               -> update { id, ...fields }
 * DELETE?id=xxx     -> remove
 */
import {
  listAllPromotions,
  findActivePromo,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "@/lib/promotionsStore";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const promo = await findActivePromo(code);
    if (!promo) {
      return Response.json({ success: false, error: "Invalid or expired code" }, { status: 404 });
    }
    return Response.json({ success: true, promo });
  }

  const promotions = await listAllPromotions();
  return Response.json({ success: true, promotions });
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.code || typeof body.code !== "string") {
      return Response.json({ success: false, error: "Promo code is required" }, { status: 400 });
    }
    const promo = await createPromotion(body);
    return Response.json({ success: true, promo }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return Response.json({ success: false, error: "Promotion id is required" }, { status: 400 });
    }
    const promo = await updatePromotion(id, updates);
    if (!promo) {
      return Response.json({ success: false, error: "Promotion not found" }, { status: 404 });
    }
    return Response.json({ success: true, promo });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return Response.json({ success: false, error: "Promotion id is required" }, { status: 400 });
    }
    await deletePromotion(id);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
