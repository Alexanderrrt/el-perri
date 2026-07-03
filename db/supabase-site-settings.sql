-- ============================================================
-- El Perri — site_settings key-value table
-- Paste into Supabase → SQL Editor → Run.
-- Safe to re-run (uses IF NOT EXISTS).
-- ============================================================

create table if not exists site_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz default now()
);

-- RLS: service-role only (admin reads/writes via supabaseAdmin).
alter table site_settings enable row level security;
-- No anon policy → browser clients are fully denied.

-- Seed default: Uber in sandbox mode.
insert into site_settings (key, value)
values ('uber_environment', 'sandbox')
on conflict (key) do nothing;
