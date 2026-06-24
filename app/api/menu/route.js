/**
 * GET /api/menu - Get all menu items
 * POST /api/menu - Add new menu item
 */

const MENU_STORAGE = [];

export async function GET(request) {
  return Response.json({ success: true, items: MENU_STORAGE });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, category, price, description } = body;

    if (!name || !price) {
      return Response.json(
        { success: false, error: "Name and price required" },
        { status: 400 }
      );
    }

    const item = {
      id: Date.now(),
      name,
      category,
      price: parseFloat(price),
      description,
      createdAt: new Date()
    };

    MENU_STORAGE.push(item);
    return Response.json({ success: true, item }, { status: 201 });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
