/**
 * Single source of truth. Edit values here and they update across every page.
 *
 * ORDER_URL: paste your ordering link when you have one (Toast, Square, etc.).
 *   Until then it points to #order and the button shows a "coming soon" note.
 * IMAGES: put photos in /public and set the path, e.g. hero: "/hero.jpg".
 */

export const SITE = {
  name: "El Perri Latin Food",
  shortName: "El Perri",
  logo: "/logo.jpg",
  tagline: "La felicidad hecha comida — de Colombia pal mundo.",
  city: "San José, CA",
  phone: "(408) 582-2502",
  phoneHref: "tel:+14085822502",
  // WhatsApp number in international format, digits only. Orders and catering
  // quotes open a prefilled chat here. Set to "" to fall back to phone calls.
  whatsapp: "14085822502",
  // Business email — set when there is a real inbox (footer shows the domain until then).
  email: "",
  address: ["🚚 Food Truck: 1358 S Winchester Blvd", "📍 Local: 960 S First St, San Jose, CA 95110"],
  mapUrl: "https://maps.google.com/?q=960+S+First+St,+San+Jose,+CA+95110",
  // Canonical site URL — drives metadataBase, robots.txt and sitemap.xml.
  // Points at the live Vercel deployment. Switch back to the brand domain
  // (https://elperrilatinfood.com) ONLY once that domain is wired to Vercel,
  // otherwise crawlers are sent to a host that doesn't run this app.
  website: "https://elperrilatinfood.vercel.app",
  social: {
    instagram: "https://www.instagram.com/elperri.food/",
  },
  hours: [
    ["Lun–Dom", "12pm – 11pm"],
  ],
  // Paste your ordering platform URL here when ready (DoorDash, Uber Eats, etc.):
  ORDER_URL: "",
};

/**
 * Build a WhatsApp deep link with a prefilled message.
 * Returns null when SITE.whatsapp is unset so callers can fall back to phone.
 */
export function waLink(message) {
  if (!SITE.whatsapp) return null;
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const IMAGES = {
  hero: "/banner.jpg",
  story: "/picada-personal.jpg",
  catering: "/picada-personal.jpg",
  // Per-dish photos: add "<item-id>": "/path.jpg" when you have them.
};

// Photo gallery shown on the home page. Add/remove freely.
export const GALLERY = [
  { src: "/picada-personal.jpg", label: "Picada personal" },
  { src: "/jugos.webp", label: "Jugos naturales" },
  { src: "/ensalada-de-frutas.webp", label: "Ensalada de frutas" },
  { src: "/cono.webp", label: "Postre" },
];

// Short promo video (autoplays muted, loops). Set to null to hide.
export const VIDEO = {
  src: "/historia.mp4",
  poster: "/banner.jpg",
  caption:
    "Lo que empezó en un food truck sigue creciendo. Gracias por acompañarnos en el camino. 💛",
};

// Instagram reels/posts to feature on the home page (free official embed — no API key).
// Paste full permalinks, e.g. "https://www.instagram.com/reel/Cxxxxxxxxxx/".
// Leave empty to show a branded "follow us" preview instead.
// Curated to the 4 highest-engagement posts (by likes).
export const REELS = [
  "https://www.instagram.com/p/DIXjnYnJYYr/", // 214 likes
  "https://www.instagram.com/p/DY0jV8INitD/", // 114 likes
  "https://www.instagram.com/p/DX0TBe-J9pb/", // 85 likes
  "https://www.instagram.com/p/DGrmtBMptMs/", // 81 likes
];

// Featured on the HOME page (a curated few)
export const FEATURED = ["cono-aleta", "burg-sanjose", "pat-paisa"];

// Full menu, grouped — used on /menu. Prices transcribed from the menu (taxes not included).
export const MENU_GROUPS = [
  {
    group: "Entradas",
    items: [
      { id: "ent-arepitas-hogao", name: "3 Arepitas con Hogao", desc: "Tres arepitas con hogao de la casa.", price: "$5" },
      { id: "ent-chorizo", name: "Chorizo con Arepa", desc: "Chorizo a la parrilla con arepa.", price: "$10" },
      { id: "ent-arepa-paisa", name: "Arepa Paisa con Chicharrón", desc: "Arepa paisa coronada con chicharrón.", price: "$12" },
      { id: "ent-chicharron", name: "Chicharrón con Papa Criolla", desc: "Chicharrón crocante con papa criolla.", price: "$12" },
      { id: "ent-empanadas", name: "Empanadas x3", desc: "Tres empanadas con ají de la casa.", price: "$10" },
      { id: "ent-gomelitas", name: "Arepas Gomelitas", desc: "Mini arepas de la casa. Arepas x3 ($6) o arepa grande ($5).", price: "$5" },
      { id: "ent-deditos", name: "Deditos de Queso x4", desc: "Cuatro deditos de queso crocantes.", price: "$8" },
    ],
  },
  {
    group: "Arepas rellenas",
    items: [
      { id: "arepa-criolla", name: "Criolla", desc: "Arepa rellena de queso, carne, pollo, maíz y chorizo.", price: "$15" },
      { id: "arepa-campesina", name: "Campesina", desc: "Arepa rellena de queso, carne, pollo, maduro y chicharrón.", price: "$16" },
    ],
  },
  {
    group: "Patacones",
    items: [
      { id: "pat-llanero", name: "Llanero", desc: "Base de patacón maduro, carne y pollo desmechados, salchicha, hogao y queso.", price: "$17" },
      { id: "pat-paisa", name: "Paisa", desc: "Base de patacón maduro, carne desmechada, guacamole, maíz tierno, salsita de la casa y queso.", price: "$16", tag: "Favorita" },
      { id: "pat-rolo", name: "Rolo", desc: "Base de patacón maduro, pollo desmechado, champiñón, tocineta y queso.", price: "$16" },
      { id: "pat-colombiano", name: "Colombiano", desc: "Base de patacón maduro, pollo o carne desmechada, chorizo, maíz tierno, tocineta, salsas y queso. Con pollo o con carne.", price: "$17 / $18" },
    ],
  },
  {
    group: "Salchipapas",
    items: [
      { id: "sal-sencilla", name: "Sencilla", desc: "Base de papa francesa, salchicha, queso y salsas.", price: "$12" },
      { id: "sal-sabrosa", name: "Sabrosa", desc: "Base de papa francesa, salchicha, queso en cubitos, moneditas de plátano y salsas.", price: "$15" },
      { id: "sal-salvaje", name: "Salvaje", desc: "Papa francesa bañada en queso y salsas, carne, salchicha, plátano maduro y chicharrón.", price: "$20" },
      { id: "sal-monster", name: "Monster", desc: "Papa francesa bañada en queso y salsas, carne, pollo, maíz tierno y salchicha.", price: "$22", tag: "La más grande" },
    ],
  },
  {
    group: "Hamburguesas",
    items: [
      { id: "burg-miami", name: "Miami", desc: "Pan artesanal, carne de la casa, tocineta, piña, papa ripio, cebolla, vegetales, queso y papas a la francesa.", price: "$16" },
      { id: "burg-sanjose", name: "San José", desc: "Pan artesanal, carne de la casa, guacamole, tocineta, papa ripio, cebolla, vegetales, queso y papas a la francesa.", price: "$17", tag: "Signature" },
      { id: "burg-vegas", name: "Las Vegas", desc: "Pan artesanal, carne de la casa, maíz dulce en hogao, cebolla, tocineta, papa ripio, vegetales, queso y papas a la francesa.", price: "$17" },
      { id: "burg-chicago", name: "Chicago", desc: "Pan artesanal, carne de la casa, plátano maduro, salchicha, cebolla, papa ripio, vegetales, queso y papas a la francesa. Sencilla o doble carne.", price: "$18 / $22" },
    ],
  },
  {
    group: "Conos de la casa · Los recomendados",
    items: [
      { id: "cono-aleta", name: "Aleta", desc: "Papitas a la francesa, 8 alas bañadas en salsa BBQ y gaseosa.", price: "$20", tag: "Recomendado" },
      { id: "cono-topdasher", name: "La Top Dasher Mazorcada", desc: "Papitas a la francesa, carne y pollo desmechados, maíz tierno y queso gratinado en salsa cremosa de la casa.", price: "$18", tag: "Recomendado" },
    ],
  },
  {
    group: "Adiciones",
    items: [
      { id: "add-carne", name: "Carne", desc: "", price: "$4" },
      { id: "add-pollo", name: "Pollo", desc: "", price: "$4" },
      { id: "add-chicharron", name: "Chicharrón", desc: "", price: "$4" },
      { id: "add-chorizo", name: "Chorizo", desc: "", price: "$4" },
      { id: "add-papa", name: "Papa Francesa", desc: "", price: "$4" },
      { id: "add-salchicha", name: "Salchicha", desc: "", price: "$3" },
      { id: "add-champinon", name: "Champiñón", desc: "", price: "$3" },
      { id: "add-tocineta", name: "Tocineta", desc: "", price: "$3" },
      { id: "add-maiz", name: "Maíz Tierno", desc: "", price: "$2" },
      { id: "add-guacamole", name: "Guacamole", desc: "", price: "$2" },
      { id: "add-platanito", name: "Platanito", desc: "", price: "$2" },
      { id: "add-codorniz", name: "Huevos de Codorniz x6", desc: "", price: "$5" },
      { id: "add-cebolla", name: "Cebolla Caramelizada", desc: "", price: "$2" },
    ],
  },
  {
    group: "Heladería y postres",
    items: [
      { id: "post-wafles", name: "Wafles Dulces", desc: "Waffle con 2 frutas, bola de helado y salsa a elegir. Frutas: fresa, mango, banano o kiwi. Helado: vainilla, fresa, cookies and cream o chocolate. Salsa: chocolate, caramelo, frutos rojos o leche condensada.", price: "$15" },
      { id: "post-malteadas", name: "Malteadas", desc: "Oreo, M&M, Kinder o Chocorramo, con el sabor de helado que prefieras.", price: "$15" },
      { id: "post-ensalada", name: "Ensalada de Frutas", desc: "Fruta picada con queso, crema, milo, leche condensada y galleta wafer.", price: "$16" },
      { id: "post-banana-split", name: "Banana Split", desc: "3 bolas de helado, banano, barquillo, crema chantilly, salsa y cereza.", price: "$14" },
      { id: "post-fresas-crema", name: "Fresas con Crema", desc: "Crema chantilly, fresas, leche condensada, milo en polvo y barquillo.", price: "$14" },
    ],
  },
  {
    group: "Jugos naturales y granizados",
    items: [
      { id: "jugo-agua", name: "Jugo Natural en Agua", desc: "Maracuyá, lulo, mora, mango o guanábana.", price: "$5" },
      { id: "jugo-leche", name: "Jugo Natural en Leche", desc: "Maracuyá, lulo, mora, mango o guanábana.", price: "$6" },
      { id: "jugo-citrica", name: "Cítrica", desc: "Jugo cítrico de la casa.", price: "$7" },
      { id: "jugo-cerezada", name: "Cerezada", desc: "Jugo cerezado de la casa.", price: "$7" },
      { id: "granizado", name: "Granizados", desc: "Maracuyá, lulo, mora, mango o guanábana, con leche condensada, chantilly y cereza.", price: "$9" },
    ],
  },
  {
    group: "Gaseosas y embotellados",
    items: [
      { id: "drink-sprite", name: "Sprite", desc: "", price: "$4" },
      { id: "drink-cocacola", name: "Coca-Cola", desc: "", price: "$4" },
      { id: "drink-postobon", name: "Postobón Manzana", desc: "", price: "$5" },
      { id: "drink-colombiana", name: "Colombiana", desc: "", price: "$5" },
      { id: "drink-hit", name: "Hit", desc: "", price: "$5" },
      { id: "drink-pony", name: "Pony Malta", desc: "", price: "$5" },
      { id: "drink-cola-pola", name: "Cola y Pola", desc: "", price: "$5" },
      { id: "drink-agua", name: "Agua", desc: "", price: "$2" },
    ],
  },
  {
    group: "Cervezas",
    items: [
      { id: "beer-club", name: "Club Colombia", desc: "", price: "$6" },
      { id: "beer-aguila", name: "Águila", desc: "", price: "$6" },
      { id: "beer-poker", name: "Poker", desc: "", price: "$6" },
      { id: "beer-modelo", name: "Modelo", desc: "", price: "$6" },
      { id: "beer-corona", name: "Corona", desc: "", price: "$6" },
      { id: "beer-michela", name: "Michela tu cerveza", desc: "Conviértela en michelada.", price: "+$2" },
    ],
  },
  {
    group: "Bebidas calientes · Solo en invierno",
    items: [
      { id: "hot-milo", name: "Milo Caliente", desc: "", price: "$7" },
      { id: "hot-aguapanela", name: "Aguapanela con Queso", desc: "", price: "$8" },
      { id: "hot-cafe", name: "Café con Leche", desc: "", price: "$4" },
    ],
  },
];
