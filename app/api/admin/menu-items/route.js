/**
 * GET /api/admin/menu-items - Get all menu items from admin panel
 * Returns menu items managed by admin
 */

let menuItems = [
  {
    id: "aleta",
    name: "Aleta",
    category: "ENTRADAS",
    price: "$20",
    description: "Papitas a la francesa, 8 alas bañadas en salsa BBQ y gaseosa.",
    tag: "RECOMENDADO"
  },
  {
    id: "san-jose",
    name: "San José",
    category: "HAMBURGUESAS",
    price: "$17",
    description: "Pan artesanal, carne de la casa, guacamole, tocineta, papa ripio, cebolla, vegetales, queso y papas a la francesa.",
    tag: "SIGNATURE"
  },
  {
    id: "paisa",
    name: "Paisa",
    category: "PATACONES",
    price: "$16",
    description: "Base de patacón maduro, carne desmechada, guacamole, maíz tierno, salsita de la casa y queso.",
    tag: "FAVORITA"
  }
];

export async function GET(request) {
  return Response.json({ success: true, items: menuItems });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const newItem = {
      id: body.name.toLowerCase().replace(/\s+/g, "-"),
      ...body,
      createdAt: new Date()
    };
    menuItems.push(newItem);
    return Response.json({ success: true, item: newItem }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const index = menuItems.findIndex(item => item.id === id);
    if (index === -1) {
      return Response.json({ success: false, error: "Item not found" }, { status: 404 });
    }
    menuItems[index] = { ...menuItems[index], ...updates };
    return Response.json({ success: true, item: menuItems[index] });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    menuItems = menuItems.filter(item => item.id !== id);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
