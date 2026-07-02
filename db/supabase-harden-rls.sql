-- ============================================================
-- El Perri — HARDENED Row Level Security  (replaces the permissive
-- "anon_all_*" policies in db/supabase-schema.sql)
--
--  WHY THIS EXISTS
--  The current schema enables RLS but then opens every table with
--      create policy "anon_all_x" on x for all using (true) with check (true);
--  Because the browser ships the PUBLIC anon key, that means ANYONE on the
--  internet can read every subscriber email and every registered_users row
--  (passwords are stored in plain text), and can insert/update/delete menu
--  items, orders and promotions. This file locks that down to least privilege.
--
--  ⚠️  DO NOT RUN THIS BY ITSELF ON THE LIVE SITE YET.
--  Today the public menu, the admin dashboard, AND the daily-lunch cron all
--  read/write Supabase with the *anon* key. After you apply these policies,
--  anon can no longer read subscribers / registered_users or write the menu,
--  so the admin panel and the email cron will break UNTIL you also do the
--  server-side change below. Apply BOTH together.
--
--  REQUIRED PAIRED CODE CHANGE (do first, then run this file)
--  1. In Supabase → Project Settings → API, copy the *service_role* key.
--  2. Add it to Vercel as a SERVER-ONLY env var (NOT NEXT_PUBLIC_):
--         SUPABASE_SERVICE_ROLE_KEY=...
--  3. Create a server-only client used ONLY inside API routes / server code
--     (never imported into a "use client" component):
--         // lib/supabaseAdmin.js
--         import { createClient } from "@supabase/supabase-js";
--         export const supabaseAdmin = createClient(
--           process.env.NEXT_PUBLIC_SUPABASE_URL,
--           process.env.SUPABASE_SERVICE_ROLE_KEY,        // bypasses RLS
--           { auth: { persistSession: false } }
--         );
--  4. Move every admin/cron read & write of subscribers, registered_users,
--     orders, menu_items and daily_special behind authenticated API routes
--     that use supabaseAdmin (the service_role key bypasses RLS). The browser
--     keeps using the anon key only for: reading the menu, reading today's
--     lunch, and inserting a subscriber from the opt-in popup.
--  5. Best practice for accounts: stop storing plain-text passwords — migrate
--     sign-up / sign-in to Supabase Auth (auth.users) and drop the plain-text
--     registered_users.password column.
-- ============================================================

-- Make sure RLS is on (no-op if already enabled)
alter table registered_users enable row level security;
alter table menu_items       enable row level security;
alter table orders           enable row level security;
alter table subscribers      enable row level security;
alter table promotions       enable row level security;
alter table daily_special    enable row level security;

-- Drop the old wide-open policies
do $$
declare t text;
begin
  foreach t in array array['registered_users','menu_items','orders','subscribers','promotions','daily_special']
  loop
    execute format('drop policy if exists "anon_all_%1$s" on %1$s;', t);
  end loop;
end $$;

-- ---------- PUBLIC (anon key) — least privilege ----------

-- Menu: world-readable (it's shown on the public site). No public writes.
drop policy if exists "public_read_menu_items" on menu_items;
create policy "public_read_menu_items" on menu_items
  for select to anon using (true);

-- Today's lunch: world-readable. No public writes.
drop policy if exists "public_read_daily_special" on daily_special;
create policy "public_read_daily_special" on daily_special
  for select to anon using (true);

-- Promotions: allow reading active codes only (codes are not secret). No writes.
drop policy if exists "public_read_active_promotions" on promotions;
create policy "public_read_active_promotions" on promotions
  for select to anon using (active = true);

-- Subscribers: the opt-in popup may INSERT, but the public may NOT read,
-- update or delete (protects customer emails). Admin reads via service_role.
drop policy if exists "public_insert_subscribers" on subscribers;
create policy "public_insert_subscribers" on subscribers
  for insert to anon with check (true);

-- registered_users and orders: NO public policies at all => anon fully denied.
-- All access happens server-side with the service_role key (which bypasses RLS).

-- ============================================================
-- After running: verify in Supabase → Auth → Policies that the only anon
-- capabilities are: SELECT menu_items, SELECT daily_special, SELECT active
-- promotions, INSERT subscribers. Everything else should be denied to anon.
-- ============================================================
