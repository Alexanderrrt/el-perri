/**
 * GET /api/admin/promotions - Get all active promotions
 * POST /api/admin/promotions/validate - Validate a promo code
 */

let promotions = [
  {
    id: "welcome",
    code: "WELCOME",
    type: "percent",
    discount: 10,
    description: "10% off first order",
    expiry: "2026-12-31",
    active: true
  },
  {
    id: "friends",
    code: "FRIENDS",
    type: "fixed",
    discount: 5,
    description: "$5 off orders over $25",
    expiry: "2026-12-31",
    active: true
  }
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    // Validate specific code
    const promo = promotions.find(p => p.code.toUpperCase() === code.toUpperCase() && p.active);
    if (!promo) {
      return Response.json({ success: false, error: "Invalid or expired code" }, { status: 404 });
    }
    return Response.json({ success: true, promo });
  }

  // Return all active promotions
  const activePromos = promotions.filter(p => p.active && new Date(p.expiry) > new Date());
  return Response.json({ success: true, promotions: activePromos });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const newPromo = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date()
    };
    promotions.push(newPromo);
    return Response.json({ success: true, promo: newPromo }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const index = promotions.findIndex(p => p.id === id);
    if (index === -1) {
      return Response.json({ success: false, error: "Promotion not found" }, { status: 404 });
    }
    promotions[index] = { ...promotions[index], ...updates };
    return Response.json({ success: true, promo: promotions[index] });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    promotions = promotions.filter(p => p.id !== id);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
