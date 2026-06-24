-- ============================================================
-- El Perri — Daily lunch reminder feature
-- Run this in Supabase → SQL Editor → Run (safe to re-run).
-- Adds: daily-lunch opt-in flag on subscribers + a daily_special table.
-- ============================================================

-- 1) Mark which subscribers want the daily lunch email
alter table subscribers add column if not exists daily_lunch boolean default true;

-- 2) The "menú del día" — a single row the admin updates each day
create table if not exists daily_special (
  id         text primary key default 'current',
  lunch      text default '',
  updated_at timestamptz default now()
);

insert into daily_special (id, lunch) values ('current', '')
on conflict (id) do nothing;

-- 3) Row Level Security (permissive, matches the rest of this phase)
alter table daily_special enable row level security;
drop policy if exists "anon_all_daily_special" on daily_special;
create policy "anon_all_daily_special" on daily_special for all using (true) with check (true);

-- 4) Realtime so the admin's lunch edits broadcast live
alter publication supabase_realtime add table daily_special;
