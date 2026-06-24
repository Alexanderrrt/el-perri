-- ============================================================
-- El Perri — Supabase schema
-- Paste this whole file into Supabase → SQL Editor → Run.
-- Safe to re-run (uses IF NOT EXISTS / drop-and-recreate policies).
-- ============================================================

-- ---------- registered_users (guest sign-ups from welcome bubble) ----------
create table if not exists registered_users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  password    text not null,            -- demo only; move to Supabase Auth for real hashing
  name        text default 'User',
  newsletter  boolean default true,
  created_at  timestamptz default now()
);

-- ---------- menu_items ----------
create table if not exists menu_items (
  id          text primary key,         -- slug like "burg-sanjose"
  name        text not null,
  category    text default 'Otros',
  price       text not null,            -- kept as text to preserve "$17 / $18"
  description text default '',
  tag         text,
  created_at  timestamptz default now()
);

-- ---------- orders ----------
create table if not exists orders (
  id          text primary key,
  customer    text,
  email       text,
  phone       text,
  address     text,
  items       jsonb default '[]'::jsonb,
  total       numeric default 0,
  status      text default 'pending',
  created_at  timestamptz default now()
);

-- ---------- subscribers (newsletter-only opt-ins) ----------
create table if not exists subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  name        text default 'Subscriber',
  created_at  timestamptz default now()
);

-- ---------- promotions ----------
create table if not exists promotions (
  id          text primary key,
  code        text unique not null,
  type        text default 'percent',   -- 'percent' | 'fixed'
  discount    numeric default 0,
  description text default '',
  expiry      date,
  active      boolean default true,
  created_at  timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- For this phase the custom admin (password + TOTP) and the public
-- site both use the anon key, so policies are permissive. Tighten
-- with Supabase Auth before handling sensitive PII at scale.
-- ============================================================
alter table registered_users enable row level security;
alter table menu_items       enable row level security;
alter table orders           enable row level security;
alter table subscribers      enable row level security;
alter table promotions       enable row level security;

-- helper: drop a policy if it exists, then create
do $$
declare t text;
begin
  foreach t in array array['registered_users','menu_items','orders','subscribers','promotions']
  loop
    execute format('drop policy if exists "anon_all_%1$s" on %1$s;', t);
    execute format('create policy "anon_all_%1$s" on %1$s for all using (true) with check (true);', t);
  end loop;
end $$;

-- ============================================================
-- Realtime — broadcast row changes to subscribed clients
-- ============================================================
alter publication supabase_realtime add table registered_users;
alter publication supabase_realtime add table menu_items;
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table promotions;

-- ============================================================
-- Seed the full menu (idempotent upsert)
-- ============================================================
insert into menu_items (id, name, category, price, description, tag) values
  ('ent-arepitas-hogao','3 Arepitas con Hogao','Entradas','$5','Tres arepitas con hogao de la casa.',null),
  ('ent-chorizo','Chorizo con Arepa','Entradas','$10','Chorizo a la parrilla con arepa.',null),
  ('ent-arepa-paisa','Arepa Paisa con Chicharrón','Entradas','$12','Arepa paisa coronada con chicharrón.',null),
  ('ent-chicharron','Chicharrón con Papa Criolla','Entradas','$12','Chicharrón crocante con papa criolla.',null),
  ('ent-empanadas','Empanadas x3','Entradas','$10','Tres empanadas con ají de la casa.',null),
  ('ent-gomelitas','Arepas Gomelitas','Entradas','$5','Mini arepas de la casa. Arepas x3 ($6) o arepa grande ($5).',null),
  ('ent-deditos','Deditos de Queso x4','Entradas','$8','Cuatro deditos de queso crocantes.',null),
  ('arepa-criolla','Criolla','Arepas rellenas','$15','Arepa rellena de queso, carne, pollo, maíz y chorizo.',null),
  ('arepa-campesina','Campesina','Arepas rellenas','$16','Arepa rellena de queso, carne, pollo, maduro y chicharrón.',null),
  ('pat-llanero','Llanero','Patacones','$17','Base de patacón maduro, carne y pollo desmechados, salchicha, hogao y queso.',null),
  ('pat-paisa','Paisa','Patacones','$16','Base de patacón maduro, carne desmechada, guacamole, maíz tierno, salsita de la casa y queso.','Favorita'),
  ('pat-rolo','Rolo','Patacones','$16','Base de patacón maduro, pollo desmechado, champiñón, tocineta y queso.',null),
  ('pat-colombiano','Colombiano','Patacones','$17 / $18','Base de patacón maduro, pollo o carne desmechada, chorizo, maíz tierno, tocineta, salsas y queso. Con pollo o con carne.',null),
  ('sal-sencilla','Sencilla','Salchipapas','$12','Base de papa francesa, salchicha, queso y salsas.',null),
  ('sal-sabrosa','Sabrosa','Salchipapas','$15','Base de papa francesa, salchicha, queso en cubitos, moneditas de plátano y salsas.',null),
  ('sal-salvaje','Salvaje','Salchipapas','$20','Papa francesa bañada en queso y salsas, carne, salchicha, plátano maduro y chicharrón.',null),
  ('sal-monster','Monster','Salchipapas','$22','Papa francesa bañada en queso y salsas, carne, pollo, maíz tierno y salchicha.','La más grande'),
  ('burg-miami','Miami','Hamburguesas','$16','Pan artesanal, carne de la casa, tocineta, piña, papa ripio, cebolla, vegetales, queso y papas a la francesa.',null),
  ('burg-sanjose','San José','Hamburguesas','$17','Pan artesanal, carne de la casa, guacamole, tocineta, papa ripio, cebolla, vegetales, queso y papas a la francesa.','Signature'),
  ('burg-vegas','Las Vegas','Hamburguesas','$17','Pan artesanal, carne de la casa, maíz dulce en hogao, cebolla, tocineta, papa ripio, vegetales, queso y papas a la francesa.',null),
  ('burg-chicago','Chicago','Hamburguesas','$18 / $22','Pan artesanal, carne de la casa, plátano maduro, salchicha, cebolla, papa ripio, vegetales, queso y papas a la francesa. Sencilla o doble carne.',null),
  ('cono-aleta','Aleta','Conos de la casa · Los recomendados','$20','Papitas a la francesa, 8 alas bañadas en salsa BBQ y gaseosa.','Recomendado'),
  ('cono-topdasher','La Top Dasher Mazorcada','Conos de la casa · Los recomendados','$18','Papitas a la francesa, carne y pollo desmechados, maíz tierno y queso gratinado en salsa cremosa de la casa.','Recomendado'),
  ('add-carne','Carne','Adiciones','$4','',null),
  ('add-pollo','Pollo','Adiciones','$4','',null),
  ('add-chicharron','Chicharrón','Adiciones','$4','',null),
  ('add-chorizo','Chorizo','Adiciones','$4','',null),
  ('add-papa','Papa Francesa','Adiciones','$4','',null),
  ('add-salchicha','Salchicha','Adiciones','$3','',null),
  ('add-champinon','Champiñón','Adiciones','$3','',null),
  ('add-tocineta','Tocineta','Adiciones','$3','',null),
  ('add-maiz','Maíz Tierno','Adiciones','$2','',null),
  ('add-guacamole','Guacamole','Adiciones','$2','',null),
  ('add-platanito','Platanito','Adiciones','$2','',null),
  ('add-codorniz','Huevos de Codorniz x6','Adiciones','$5','',null),
  ('add-cebolla','Cebolla Caramelizada','Adiciones','$2','',null),
  ('post-wafles','Wafles Dulces','Heladería y postres','$15','Waffle con 2 frutas, bola de helado y salsa a elegir.',null),
  ('post-malteadas','Malteadas','Heladería y postres','$15','Oreo, M&M, Kinder o Chocorramo, con el sabor de helado que prefieras.',null),
  ('post-ensalada','Ensalada de Frutas','Heladería y postres','$16','Fruta picada con queso, crema, milo, leche condensada y galleta wafer.',null),
  ('post-banana-split','Banana Split','Heladería y postres','$14','3 bolas de helado, banano, barquillo, crema chantilly, salsa y cereza.',null),
  ('post-fresas-crema','Fresas con Crema','Heladería y postres','$14','Crema chantilly, fresas, leche condensada, milo en polvo y barquillo.',null),
  ('jugo-agua','Jugo Natural en Agua','Jugos naturales y granizados','$5','Maracuyá, lulo, mora, mango o guanábana.',null),
  ('jugo-leche','Jugo Natural en Leche','Jugos naturales y granizados','$6','Maracuyá, lulo, mora, mango o guanábana.',null),
  ('jugo-citrica','Cítrica','Jugos naturales y granizados','$7','Jugo cítrico de la casa.',null),
  ('jugo-cerezada','Cerezada','Jugos naturales y granizados','$7','Jugo cerezado de la casa.',null),
  ('granizado','Granizados','Jugos naturales y granizados','$9','Maracuyá, lulo, mora, mango o guanábana, con leche condensada, chantilly y cereza.',null),
  ('drink-sprite','Sprite','Gaseosas y embotellados','$4','',null),
  ('drink-cocacola','Coca-Cola','Gaseosas y embotellados','$4','',null),
  ('drink-postobon','Postobón Manzana','Gaseosas y embotellados','$5','',null),
  ('drink-colombiana','Colombiana','Gaseosas y embotellados','$5','',null),
  ('drink-hit','Hit','Gaseosas y embotellados','$5','',null),
  ('drink-pony','Pony Malta','Gaseosas y embotellados','$5','',null),
  ('drink-cola-pola','Cola y Pola','Gaseosas y embotellados','$5','',null),
  ('drink-agua','Agua','Gaseosas y embotellados','$2','',null),
  ('beer-club','Club Colombia','Cervezas','$6','',null),
  ('beer-aguila','Águila','Cervezas','$6','',null),
  ('beer-poker','Poker','Cervezas','$6','',null),
  ('beer-modelo','Modelo','Cervezas','$6','',null),
  ('beer-corona','Corona','Cervezas','$6','',null),
  ('beer-michela','Michela tu cerveza','Cervezas','+$2','Conviértela en michelada.',null),
  ('hot-milo','Milo Caliente','Bebidas calientes · Solo en invierno','$7','',null),
  ('hot-aguapanela','Aguapanela con Queso','Bebidas calientes · Solo en invierno','$8','',null),
  ('hot-cafe','Café con Leche','Bebidas calientes · Solo en invierno','$4','',null)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  price = excluded.price,
  description = excluded.description,
  tag = excluded.tag;

-- ---------- seed a couple of promo codes ----------
insert into promotions (id, code, type, discount, description, expiry, active) values
  ('welcome','WELCOME','percent',10,'10% off first order','2026-12-31',true),
  ('friends','FRIENDS','fixed',5,'$5 off orders over $25','2026-12-31',true)
on conflict (id) do nothing;
