export const SITE = {
  name: "El Gran Tamal Colombiano",
  website: "https://elgrantamalcolombianoca.com",
  phone: "(559) 943-6954",
  phoneHref: "tel:+15599436954",
  whatsapp: "https://wa.me/15599436954",
  instagram: "https://www.instagram.com/elgrantamalcolombiano/",
  maps: "https://maps.app.goo.gl/ybXmprXBvVnTe1Wb8",
  address: "1302 S 1st St, San Jose, CA 95110",
  wholesaleArea: "Fontana & Los Angeles, CA",
};

export const HOURS = [
  { es: "Lunes", en: "Monday", valueEs: "Cerrado", valueEn: "Closed" },
  { es: "Martes", en: "Tuesday", valueEs: "9 a.m. – 9 p.m.", valueEn: "9 a.m. – 9 p.m." },
  { es: "Miércoles", en: "Wednesday", valueEs: "9 a.m. – 9 p.m.", valueEn: "9 a.m. – 9 p.m." },
  { es: "Jueves", en: "Thursday", valueEs: "9 a.m. – 9 p.m.", valueEn: "9 a.m. – 9 p.m." },
  { es: "Viernes", en: "Friday", valueEs: "9 a.m. – 9 p.m.", valueEn: "9 a.m. – 9 p.m." },
  { es: "Sábado", en: "Saturday", valueEs: "8 a.m. – 9 p.m.", valueEn: "8 a.m. – 9 p.m." },
  { es: "Domingo", en: "Sunday", valueEs: "8 a.m. – 4 p.m.", valueEn: "8 a.m. – 4 p.m." },
];

const item = (id, name, price, es, en) => ({ id, name, price, description: { es, en } });

export const MENU = [
  {
    id: "mains",
    title: { es: "Menú", en: "Menu" },
    items: [
      item("tamal-colombiano", "Tamal Colombiano", "$16.00", "Arroz, arveja, carne, pollo, tocino, huevo, papa, zanahoria y guiso de cebolla.", "Rice, peas, beef, chicken, bacon, egg, potato, carrot, and Colombian onion stew."),
      item("calentado-paisa", "Calentado Paisa", "$20.00", "Arroz, frijol, tocineta, carne, huevos, arepa, chorizo y plátano.", "Rice, beans, bacon, beef, eggs, arepa, chorizo, and plantain."),
      item("calentado-montanero", "Calentado Montañero", "$15.00", "Arroz, pollo y carne desmechados, maíz, guiso, plátano maduro, arepa de maíz y huevos fritos.", "Rice, shredded chicken and beef, corn, Colombian stew, sweet plantain, corn arepa, and fried eggs."),
      item("el-criollo", "El Criollo", "$15.00", "Arepa de maíz rellena de queso, huevos al gusto y carne asada.", "Cheese-stuffed corn arepa, eggs your way, and grilled beef."),
      item("huevos-pericos", "Huevos Pericos", "$14.70", "Acompañados de queso, pan y chocolate.", "Colombian-style scrambled eggs with cheese, bread, and hot chocolate."),
      item("huevos-rancheros", "Huevos Rancheros", "$14.70", "Acompañados de queso, pan y chocolate.", "Ranch-style eggs with cheese, bread, and hot chocolate."),
      item("huevos-revueltos", "Huevos Revueltos", "$13.65", "Acompañados de queso, pan y chocolate.", "Scrambled eggs with cheese, bread, and hot chocolate."),
      item("huevo-frito-desayuno", "Huevo Frito", "$13.65", "Acompañado de queso, pan y chocolate.", "Fried egg with cheese, bread, and hot chocolate."),
      item("empanada-carne", "Empanada de Carne", "$6.00", "Empanada colombiana crocante rellena de carne.", "Crispy Colombian-style empanada filled with beef."),
      item("empanada-pollo", "Empanada de Pollo", "$6.00", "Empanada colombiana crocante rellena de pollo.", "Crispy Colombian-style empanada filled with chicken."),
      item("empanada-mixta", "Empanada Mixta", "$6.00", "Empanada colombiana crocante rellena de pollo y carne.", "Crispy Colombian-style empanada filled with chicken and beef."),
      item("caldo-costilla", "Caldo de Costilla", "$16.00", "Caldo con costilla de res, papa, cebolla y cilantro, acompañado de arepa rellena de queso.", "Beef rib soup with potato, onion, and cilantro, served with a cheese-stuffed arepa."),
      item("caldo-costilla-combo", "Caldo de Costilla en Combo", "$24.00", "Costilla de res, papa, cilantro, cebolla, arepa rellena de queso, pan, queso, huevos al gusto y chocolate.", "Beef ribs, potato, cilantro, onion, cheese-stuffed arepa, bread, cheese, eggs your way, and hot chocolate."),
      item("churrasco", "Churrasco", "$29.00", "NY steak con papa criolla o papas a la francesa y ensalada.", "New York steak with Colombian potatoes or French fries and salad."),
      item("pechuga-plancha", "Pechuga a la Plancha", "$16.00", "Pechuga de pollo con papas a la francesa y ensalada.", "Grilled chicken breast with French fries and salad."),
      item("picada-mixta", "Picada Mixta", "$38.00", "Carne de res, pollo, chicharrón, chorizo, plátano maduro, papas a la francesa y papa criolla.", "Beef, chicken, pork belly, chorizo, sweet plantain, French fries, and Colombian potatoes."),
      item("el-campesino", "El Campesino", "$16.00", "Carne desmechada, guiso, maíz, arroz, plátano maduro, arepa de maíz y chorizo.", "Shredded beef, Colombian stew, corn, rice, sweet plantain, corn arepa, and chorizo."),
      item("alitas", "Alitas", "$15.00", "Pollo, papas a la francesa y salsa.", "Chicken wings with French fries and sauce."),
      item("salchimonster", "Salchimonster", "$20.00", "Papas a la francesa, pollo y carne en salsa tártara, salchicha, queso y maíz.", "French fries, chicken and beef in tartar sauce, sausage, cheese, and corn."),
      item("ceviche-chicharron", "Ceviche de Chicharrón", "$17.00", "Chicharrón, papa criolla, maíz, cebolla, cilantro y limón.", "Pork belly, Colombian potatoes, corn, onion, cilantro, and lime."),
      item("chorizo-arepa", "Chorizo con Arepa", "$7.00", "Chorizo acompañado de arepa rellena de queso.", "Chorizo served with a cheese-stuffed arepa."),
      item("arepa-pollo", "Arepa de Pollo", "$14.00", "Arepa de maíz, pollo desmechado, guiso, maíz, plátano maduro y queso.", "Corn arepa, shredded chicken, Colombian tomato and onion stew, corn, sweet plantain, and cheese."),
      item("salchitop", "Salchitop", "$18.00", "Papas a la francesa, salchicha, pollo y carne desmechados en salsa tártara, huevos de codorniz, papa ripio, queso, maíz y salsas.", "French fries, sausage, shredded chicken and beef in tartar sauce, quail eggs, shoestring potatoes, cheese, corn, and house sauces."),
      item("el-callejero", "El Callejero", "$16.00", "Pan, salchicha, carne desmechada, tocineta, queso, papa ripio y salsas.", "Bun, sausage, shredded beef, bacon, cheese, shoestring potatoes, and house sauces."),
      item("el-perro", "El Perro", "$15.00", "Pan, salchicha, pollo desmechado, tocineta, queso, papa ripio y salsas.", "Bun, sausage, shredded chicken, bacon, cheese, shoestring potatoes, and house sauces."),
      item("el-bandido", "El Bandido", "$15.00", "Pan, salchicha, pollo asado en trozos, plátano maduro, queso, papa ripio y salsas.", "Bun, sausage, grilled chicken, sweet plantain, cheese, shoestring potatoes, and house sauces."),
      item("arepa-mixta", "Arepa Mixta", "$19.00", "Arepa de maíz, pollo y carne desmechados, guiso, maíz, plátano maduro, queso, huevos de codorniz y chorizo.", "Corn arepa, shredded chicken and beef, Colombian stew, corn, sweet plantain, cheese, quail eggs, and chorizo."),
      item("arepa-carne", "Arepa de Carne", "$17.00", "Arepa de maíz, carne desmechada, guiso, maíz, plátano maduro y queso.", "Corn arepa, shredded beef, Colombian stew, corn, sweet plantain, and cheese."),
      item("salchiparce", "Salchiparce", "$18.00", "Papas a la francesa, salchicha, pollo desmechado en salsa tártara, plátano maduro, queso, maíz y salsas.", "French fries, sausage, shredded chicken in tartar sauce, sweet plantain, cheese, corn, and house sauces."),
      item("salchipapa-tradicional", "Salchipapa Tradicional", "$14.00", "Papas a la francesa, salchicha, queso, maíz y salsas.", "French fries, sausage, cheese, corn, and house sauces."),
      item("pan-rollo-menu", "Pan Rollo (Adicional)", "$2.00", "Pan rollo adicional.", "Additional bread roll."),
    ],
  },
  {
    id: "drinks",
    title: { es: "Bebidas", en: "Drinks" },
    items: [
      item("coca-cola", "Coca-Cola", "$3.00", "Bebida gaseosa.", "Soft drink."),
      item("colombiana", "Colombiana", "$5.00", "Gaseosa colombiana.", "Colombian soft drink."),
      item("manzana-postobon", "Manzana Postobón", "$5.00", "Gaseosa sabor manzana.", "Apple-flavored Colombian soft drink."),
      item("pony-malta", "Pony Malta", "$5.00", "Bebida de malta.", "Colombian malt beverage."),
      item("agua", "Botella de Agua", "$1.00", "Agua embotellada.", "Bottled water."),
      item("uva-postobon", "Uva Postobón", "$5.00", "Gaseosa sabor uva.", "Grape-flavored Colombian soft drink."),
      item("san-pellegrino", "San Pellegrino", "$3.00", "Agua mineral con gas.", "Sparkling mineral water."),
      item("batido-mora", "Batido de Mora", "$7.00", "Batido natural de mora.", "Blackberry fruit shake."),
      item("batido-maracuya", "Batido de Maracuyá", "$7.00", "Batido natural de maracuyá.", "Passion-fruit shake."),
      item("batido-mango", "Batido de Mango", "$7.00", "Batido natural de mango.", "Mango fruit shake."),
      item("batido-lulo", "Batido de Lulo", "$7.00", "Batido natural de lulo.", "Lulo fruit shake."),
      item("batido-guanabana", "Batido de Guanábana", "$7.00", "Batido natural de guanábana.", "Soursop fruit shake."),
      item("cafe-tinto", "Café / Tinto", "$3.15", "Café colombiano.", "Colombian black coffee."),
      item("chocolate", "Chocolate", "$5.25", "Chocolate caliente.", "Hot chocolate."),
      item("cafe-leche", "Café con Leche", "$4.20", "Café colombiano con leche.", "Colombian coffee with milk."),
    ],
  },
  {
    id: "extras",
    title: { es: "Adicionales", en: "Add-ons" },
    items: [
      item("pan-rollo", "Pan Rollo", "$2.00", "Porción adicional.", "Extra portion."),
      item("platano-maduro", "Porción de Plátano Maduro", "$1.50", "Porción adicional.", "Extra portion."),
      item("papa-criolla", "Papa Criolla x12", "$3.50", "Doce papas criollas.", "Twelve Colombian potatoes."),
      item("papas-francesa", "Papas a la Francesa", "$3.00", "Porción adicional.", "Extra portion."),
      item("arroz", "Arroz", "$2.00", "Porción adicional.", "Extra portion."),
      item("queso-fresco", "Queso Fresco", "$1.00", "Porción adicional.", "Extra portion."),
      item("rellena", "Rellena", "$4.50", "Porción adicional.", "Colombian blood sausage."),
      item("chorizo", "Chorizo", "$4.50", "Porción adicional.", "Extra portion."),
      item("chicharron", "Chicharrón", "$7.00", "Porción adicional.", "Extra pork belly."),
      item("carne-trozo", "Carne en Trozo (200 g)", "$9.00", "Porción adicional de carne.", "Extra 200 g beef portion."),
      item("pollo-trozo", "Pollo en Trozo (300 g)", "$7.00", "Porción adicional de pollo.", "Extra 300 g chicken portion."),
      item("frijoles", "Frijoles", "$3.50", "Porción adicional.", "Extra beans."),
      item("arepa-pequena", "Arepa Pequeña", "$1.00", "Arepa de maíz pequeña.", "Small corn arepa."),
      item("arepa-paisa", "Arepa Paisa Grande", "$3.50", "Arepa de maíz grande.", "Large corn arepa."),
      item("huevo-frito", "Huevo Frito", "$1.50", "Un huevo frito.", "One fried egg."),
      item("huevos-fritos", "Huevos Fritos", "$3.50", "Porción de huevos fritos.", "Fried eggs."),
      item("huevos-revueltos-extra", "Huevos Revueltos", "$3.50", "Porción adicional.", "Scrambled eggs."),
      item("huevos-pericos-extra", "Huevos Pericos", "$4.00", "Huevos revueltos con tomate y cebolla.", "Colombian scrambled eggs with tomato and onion."),
      item("huevos-rancheros-extra", "Huevos Rancheros", "$5.00", "Porción adicional.", "Ranch-style eggs."),
      item("consome", "Consomé", "$3.00", "Taza de consomé.", "Cup of consommé."),
    ],
  },
];

export const MEDIA_SOURCES = [
  { src: "/media/truck.webp", source: "official", post: null },
  { src: "/media/salchipapa.webp", source: "official", post: null },
  { src: "/media/empanadas.webp", source: "official", post: null },
  { src: "/media/san-jose-1.webp", source: "instagram", post: "DYKa-3sFNbM" },
  { src: "/media/san-jose-2.webp", source: "instagram", post: "DXGX69MgFIZ" },
  { src: "/media/san-jose-visit-1.webp", source: "instagram", post: "DVm5xegAO-k" },
  { src: "/media/san-jose-visit-2.webp", source: "instagram", post: "DVeKcT9icKm" },
  { src: "/media/san-jose-visit-3.webp", source: "instagram", post: "DVdDewjACXB" },
  { src: "/media/wholesale-1.webp", source: "instagram", post: "DWK7CUSAOTH" },
  { src: "/media/wholesale-2.webp", source: "instagram", post: "DamfbUygH0P" },
  { src: "/media/wholesale-3.webp", source: "instagram", post: "Da7DxgpgdCR" },
];

export function localizedPath(locale, page = "home") {
  const paths = {
    es: { home: "/", menu: "/menu", wholesale: "/mayoreo", about: "/historia", privacy: "/privacy", terms: "/terms" },
    en: { home: "/en", menu: "/en/menu", wholesale: "/en/wholesale", about: "/en/about", privacy: "/en/privacy", terms: "/en/terms" },
  };
  return paths[locale][page];
}

export function pageMetadata(locale, page, title, description) {
  const path = localizedPath(locale, page);
  const alternateLocale = locale === "es" ? "en" : "es";
  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: {
        "es-US": localizedPath("es", page),
        "en-US": localizedPath("en", page),
        "x-default": localizedPath("es", page),
      },
    },
    openGraph: { title, description, url: path, locale: locale === "es" ? "es_US" : "en_US", alternateLocale: alternateLocale === "es" ? "es_US" : "en_US" },
  };
}
