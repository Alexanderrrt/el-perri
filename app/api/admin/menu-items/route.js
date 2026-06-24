/**
 * GET /api/admin/menu-items - Get all menu items from admin panel
 * Returns menu items managed by admin
 */

let menuItems = [
  // Entradas
  { id: "ent-arepitas-hogao", name: "3 Arepitas con Hogao", category: "Entradas", description: "Tres arepitas con hogao de la casa.", price: "$5" },
  { id: "ent-chorizo", name: "Chorizo con Arepa", category: "Entradas", description: "Chorizo a la parrilla con arepa.", price: "$10" },
  { id: "ent-arepa-paisa", name: "Arepa Paisa con Chicharrón", category: "Entradas", description: "Arepa paisa coronada con chicharrón.", price: "$12" },
  { id: "ent-chicharron", name: "Chicharrón con Papa Criolla", category: "Entradas", description: "Chicharrón crocante con papa criolla.", price: "$12" },
  { id: "ent-empanadas", name: "Empanadas x3", category: "Entradas", description: "Tres empanadas con ají de la casa.", price: "$10" },
  { id: "ent-gomelitas", name: "Arepas Gomelitas", category: "Entradas", description: "Mini arepas de la casa. Arepas x3 ($6) o arepa grande ($5).", price: "$5" },
  { id: "ent-deditos", name: "Deditos de Queso x4", category: "Entradas", description: "Cuatro deditos de queso crocantes.", price: "$8" },

  // Arepas rellenas
  { id: "arepa-criolla", name: "Criolla", category: "Arepas rellenas", description: "Arepa rellena de queso, carne, pollo, maíz y chorizo.", price: "$15" },
  { id: "arepa-campesina", name: "Campesina", category: "Arepas rellenas", description: "Arepa rellena de queso, carne, pollo, maduro y chicharrón.", price: "$16" },

  // Patacones
  { id: "pat-llanero", name: "Llanero", category: "Patacones", description: "Base de patacón maduro, carne y pollo desmechados, salchicha, hogao y queso.", price: "$17" },
  { id: "pat-paisa", name: "Paisa", category: "Patacones", description: "Base de patacón maduro, carne desmechada, guacamole, maíz tierno, salsita de la casa y queso.", price: "$16", tag: "Favorita" },
  { id: "pat-rolo", name: "Rolo", category: "Patacones", description: "Base de patacón maduro, pollo desmechado, champiñón, tocineta y queso.", price: "$16" },
  { id: "pat-colombiano", name: "Colombiano", category: "Patacones", description: "Base de patacón maduro, pollo o carne desmechada, chorizo, maíz tierno, tocineta, salsas y queso. Con pollo o con carne.", price: "$17 / $18" },

  // Salchipapas
  { id: "sal-sencilla", name: "Sencilla", category: "Salchipapas", description: "Base de papa francesa, salchicha, queso y salsas.", price: "$12" },
  { id: "sal-sabrosa", name: "Sabrosa", category: "Salchipapas", description: "Base de papa francesa, salchicha, queso en cubitos, moneditas de plátano y salsas.", price: "$15" },
  { id: "sal-salvaje", name: "Salvaje", category: "Salchipapas", description: "Papa francesa bañada en queso y salsas, carne, salchicha, plátano maduro y chicharrón.", price: "$20" },
  { id: "sal-monster", name: "Monster", category: "Salchipapas", description: "Papa francesa bañada en queso y salsas, carne, pollo, maíz tierno y salchicha.", price: "$22", tag: "La más grande" },

  // Hamburguesas
  { id: "burg-miami", name: "Miami", category: "Hamburguesas", description: "Pan artesanal, carne de la casa, tocineta, piña, papa ripio, cebolla, vegetales, queso y papas a la francesa.", price: "$16" },
  { id: "burg-sanjose", name: "San José", category: "Hamburguesas", description: "Pan artesanal, carne de la casa, guacamole, tocineta, papa ripio, cebolla, vegetales, queso y papas a la francesa.", price: "$17", tag: "Signature" },
  { id: "burg-vegas", name: "Las Vegas", category: "Hamburguesas", description: "Pan artesanal, carne de la casa, maíz dulce en hogao, cebolla, tocineta, papa ripio, vegetales, queso y papas a la francesa.", price: "$17" },
  { id: "burg-chicago", name: "Chicago", category: "Hamburguesas", description: "Pan artesanal, carne de la casa, plátano maduro, salchicha, cebolla, papa ripio, vegetales, queso y papas a la francesa. Sencilla o doble carne.", price: "$18 / $22" },

  // Conos de la casa
  { id: "cono-aleta", name: "Aleta", category: "Conos de la casa · Los recomendados", description: "Papitas a la francesa, 8 alas bañadas en salsa BBQ y gaseosa.", price: "$20", tag: "Recomendado" },
  { id: "cono-topdasher", name: "La Top Dasher Mazorcada", category: "Conos de la casa · Los recomendados", description: "Papitas a la francesa, carne y pollo desmechados, maíz tierno y queso gratinado en salsa cremosa de la casa.", price: "$18", tag: "Recomendado" },

  // Adiciones
  { id: "add-carne", name: "Carne", category: "Adiciones", description: "", price: "$4" },
  { id: "add-pollo", name: "Pollo", category: "Adiciones", description: "", price: "$4" },
  { id: "add-chicharron", name: "Chicharrón", category: "Adiciones", description: "", price: "$4" },
  { id: "add-chorizo", name: "Chorizo", category: "Adiciones", description: "", price: "$4" },
  { id: "add-papa", name: "Papa Francesa", category: "Adiciones", description: "", price: "$4" },
  { id: "add-salchicha", name: "Salchicha", category: "Adiciones", description: "", price: "$3" },
  { id: "add-champinon", name: "Champiñón", category: "Adiciones", description: "", price: "$3" },
  { id: "add-tocineta", name: "Tocineta", category: "Adiciones", description: "", price: "$3" },
  { id: "add-maiz", name: "Maíz Tierno", category: "Adiciones", description: "", price: "$2" },
  { id: "add-guacamole", name: "Guacamole", category: "Adiciones", description: "", price: "$2" },
  { id: "add-platanito", name: "Platanito", category: "Adiciones", description: "", price: "$2" },
  { id: "add-codorniz", name: "Huevos de Codorniz x6", category: "Adiciones", description: "", price: "$5" },
  { id: "add-cebolla", name: "Cebolla Caramelizada", category: "Adiciones", description: "", price: "$2" },

  // Heladería y postres
  { id: "post-wafles", name: "Wafles Dulces", category: "Heladería y postres", description: "Waffle con 2 frutas, bola de helado y salsa a elegir. Frutas: fresa, mango, banano o kiwi. Helado: vainilla, fresa, cookies and cream o chocolate. Salsa: chocolate, caramelo, frutos rojos o leche condensada.", price: "$15" },
  { id: "post-malteadas", name: "Malteadas", category: "Heladería y postres", description: "Oreo, M&M, Kinder o Chocorramo, con el sabor de helado que prefieras.", price: "$15" },
  { id: "post-ensalada", name: "Ensalada de Frutas", category: "Heladería y postres", description: "Fruta picada con queso, crema, milo, leche condensada y galleta wafer.", price: "$16" },
  { id: "post-banana-split", name: "Banana Split", category: "Heladería y postres", description: "3 bolas de helado, banano, barquillo, crema chantilly, salsa y cereza.", price: "$14" },
  { id: "post-fresas-crema", name: "Fresas con Crema", category: "Heladería y postres", description: "Crema chantilly, fresas, leche condensada, milo en polvo y barquillo.", price: "$14" },

  // Jugos naturales
  { id: "jugo-agua", name: "Jugo Natural en Agua", category: "Jugos naturales y granizados", description: "Maracuyá, lulo, mora, mango o guanábana.", price: "$5" },
  { id: "jugo-leche", name: "Jugo Natural en Leche", category: "Jugos naturales y granizados", description: "Maracuyá, lulo, mora, mango o guanábana.", price: "$6" },
  { id: "jugo-citrica", name: "Cítrica", category: "Jugos naturales y granizados", description: "Jugo cítrico de la casa.", price: "$7" },
  { id: "jugo-cerezada", name: "Cerezada", category: "Jugos naturales y granizados", description: "Jugo cerezado de la casa.", price: "$7" },
  { id: "granizado", name: "Granizados", category: "Jugos naturales y granizados", description: "Maracuyá, lulo, mora, mango o guanábana, con leche condensada, chantilly y cereza.", price: "$9" },

  // Gaseosas
  { id: "drink-sprite", name: "Sprite", category: "Gaseosas y embotellados", description: "", price: "$4" },
  { id: "drink-cocacola", name: "Coca-Cola", category: "Gaseosas y embotellados", description: "", price: "$4" },
  { id: "drink-postobon", name: "Postobón Manzana", category: "Gaseosas y embotellados", description: "", price: "$5" },
  { id: "drink-colombiana", name: "Colombiana", category: "Gaseosas y embotellados", description: "", price: "$5" },
  { id: "drink-hit", name: "Hit", category: "Gaseosas y embotellados", description: "", price: "$5" },
  { id: "drink-pony", name: "Pony Malta", category: "Gaseosas y embotellados", description: "", price: "$5" },
  { id: "drink-cola-pola", name: "Cola y Pola", category: "Gaseosas y embotellados", description: "", price: "$5" },
  { id: "drink-agua", name: "Agua", category: "Gaseosas y embotellados", description: "", price: "$2" },

  // Cervezas
  { id: "beer-club", name: "Club Colombia", category: "Cervezas", description: "", price: "$6" },
  { id: "beer-aguila", name: "Águila", category: "Cervezas", description: "", price: "$6" },
  { id: "beer-poker", name: "Poker", category: "Cervezas", description: "", price: "$6" },
  { id: "beer-modelo", name: "Modelo", category: "Cervezas", description: "", price: "$6" },
  { id: "beer-corona", name: "Corona", category: "Cervezas", description: "", price: "$6" },
  { id: "beer-michela", name: "Michela tu cerveza", category: "Cervezas", description: "Conviértela en michelada.", price: "+$2" },

  // Bebidas calientes
  { id: "hot-milo", name: "Milo Caliente", category: "Bebidas calientes · Solo en invierno", description: "", price: "$7" },
  { id: "hot-aguapanela", name: "Aguapanela con Queso", category: "Bebidas calientes · Solo en invierno", description: "", price: "$8" },
  { id: "hot-cafe", name: "Café con Leche", category: "Bebidas calientes · Solo en invierno", description: "", price: "$4" },
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
