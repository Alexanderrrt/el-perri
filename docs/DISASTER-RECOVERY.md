# Disaster Recovery — El Perri

How to recover the site and its data, and the backup mechanisms that protect it.

## Targets

| Metric | Target | Notes |
|---|---|---|
| **RTO** (time to restore) | < 2 hours | Code redeploy is minutes; DB restore dominates. |
| **RPO** (acceptable data loss) | < 24 hours | Daily backups. Enable Supabase PITR to reduce to minutes. |

## What holds the data

- **Supabase Postgres** — the only durable store: `menu_items`, `daily_special`,
  `subscribers`, `registered_users`, `promotions`.
- **Vercel** — code/hosting. Every deployment is immutable; rollback is instant.

## Backup mechanisms

1. **Supabase managed backups** — daily logical backups (free tier ~7-day
   retention, **no PITR**). Upgrade to Pro and enable **Point-in-Time Recovery**
   for minute-level RPO. _(Action: Supabase → Settings → Add-ons → PITR.)_
2. **GitHub Actions daily `pg_dump`** — `.github/workflows/backup.yml` runs
   daily and stores a `pg_dump` as a workflow artifact (30-day retention).
   Requires the repo secret **`SUPABASE_DB_URL`** (Supabase → Settings →
   Database → Connection string → URI). Run it on demand from the Actions tab.
3. **On-demand export** — `GET /api/admin/export` (admin login required) returns
   a JSON snapshot of all tables (no password hashes) for a manual recovery copy.

## Restore runbook

### A. Code (Vercel)
1. Vercel dashboard → Deployments → pick the last good deploy → **Promote / Rollback** (instant).
2. Or `git revert <bad-commit>` and push; Vercel redeploys.

### B. Database (full loss / corruption)
1. Provision a new Supabase project (or use the existing one).
2. Recreate schema: run `db/supabase-schema.sql`, then `db/supabase-harden-rls.sql` in the SQL editor.
3. Restore data from the most recent backup:
   - **From a `pg_dump` artifact:** download from the GitHub Actions run, then
     `pg_restore --no-owner --no-privileges -d "$SUPABASE_DB_URL" el-perri-<stamp>.dump`
   - **From Supabase managed backup / PITR:** Supabase dashboard → Database → Backups.
   - **From a JSON export:** re-insert per table (last resort; smaller datasets).
4. Update Vercel env vars to point at the restored project (see checklist below).
5. Redeploy.

### C. Environment variables checklist (re-provision in Vercel)
Set for **Production + Preview** (values from your password manager / Supabase / Resend):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_USERNAME`, `ADMIN_PIN`, `ADMIN_NAME`,
`ADMIN_TOKEN_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`.
See `.env.example` for the authoritative list.

## Test-restore (quarterly)
A backup is only proven once restored. Each quarter: spin up a throwaway Supabase
project, `pg_restore` the latest dump, and verify row counts against production.
