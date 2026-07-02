# El Perri Latin Food — website

Next.js (App Router) site for a Colombian restaurant in San José, CA, with an
admin panel for menu management and a daily "almuerzo del día" email.

**Stack:** Next.js 16 (App Router) · Supabase (Postgres + Realtime) · Resend
(email) · Vercel (hosting + cron).

## Run it

```bash
npm install
cp .env.example .env.local   # fill in your own values — see below
npm run dev                  # http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Jest |
| `npm run verify` | lint + test + build — run before every commit |
| `npm run db:migrate <file>` | Apply a `.sql` file to `PG_URL` |

## Pages

- `/` — Home: intro, featured dishes, gallery, Instagram reels
- `/menu` — Full menu (live from Supabase)
- `/catering` — Catering inquiry
- `/nuestra-historia` — About / story
- `/checkout` — Guest checkout
- `/admin/login`, `/admin/dashboard` — Admin panel (menu + daily lunch email),
  gated by a signed session cookie — see `proxy.ts`

## Edit site content in ONE place

Open **`app/site.config.js`**:
- `SITE.ORDER_URL` — paste your ordering link (Toast/Square/etc.) when ready
- `SITE.phone / address / hours / email` — business details
- `IMAGES` / `GALLERY` / `VIDEO` — photos and video live in `/public`
- `REELS` — Instagram post permalinks featured on the home page
- `MENU_GROUPS` — fallback menu data (the live site reads from Supabase; see
  `db/supabase-schema.sql`)

## Environment variables

See **`.env.example`** for the full list with descriptions (Supabase, Resend,
admin credentials, cron secret). Never commit `.env.local`.

## Project structure

```
app/            Routes, components, site.config.js
lib/            Supabase clients, auth, email, validation, rate limiting
db/             Supabase schema + RLS policies (source of truth for the DB)
scripts/        One-off ops scripts (migrations, backups)
docs/           Active runbooks — see docs/README.md
docs/archive/   Historical planning/status docs, kept for reference only
assets/         Raw media not served by the site (photos, reports)
__tests__/      Jest tests
```

## More docs

- [docs/README.md](docs/README.md) — what's in `docs/`
- [CLAUDE.md](CLAUDE.md) — branching, commit, and safety rules for this repo
