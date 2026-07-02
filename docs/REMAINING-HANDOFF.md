# Remaining hand-off — items that need you

The audit remediation is mostly done in code (see git history). These remaining
items can't be completed from the codebase alone — they need your Supabase
dashboard, DNS registrar, billing, or third-party accounts. Ordered by priority.

## 🔴 1. Lock down Supabase RLS (security — highest priority)
**Why:** the anon key (shipped in the browser) can currently read every row,
including `subscribers` emails and `registered_users`. Passwords are now bcrypt
hashes (fixed in code), but emails are still exposed.

**Blocker:** the admin panel and lunch features currently **write** via the anon
key from the browser. Locking RLS will break them unless those writes move to
server-side routes using the service-role key. So do this in order:

1. Add **`SUPABASE_SERVICE_ROLE_KEY`** in Vercel (Supabase → Settings → API →
   `service_role` key). `lib/supabaseAdmin.js` and `/api/admin/export` already
   use it when present.
2. Move admin menu writes and lunch writes to server routes that use
   `supabaseAdmin` (follow-up dev work — the read paths can stay on anon).
3. Then run `db/supabase-harden-rls.sql` in the Supabase SQL editor and verify
   anon can only `SELECT menu_items/daily_special/active promotions` and
   `INSERT subscribers`.

## 🟠 2. Connect the brand domain to Vercel (SEO + trust)
`elperrilatinfood.com` currently serves a **different** site (Apache/PHP at
`104.239.175.75`), so SEO was pointing there. Code now points canonical URLs at
the `.vercel.app` host as a stopgap.
1. Vercel → Project → Settings → Domains → add `elperrilatinfood.com` + `www`.
2. At your DNS registrar: apex `A → 76.76.21.21`, `www CNAME → cname.vercel-dns.com`.
3. After it resolves to Vercel, set `SITE.website` back to
   `https://elperrilatinfood.com` in `app/site.config.js` and redeploy.

## 🟠 3. Email deliverability (Resend domain)
Daily-lunch email only reaches your own address until a domain is verified.
1. Resend → Domains → verify a domain you control (add the DNS records).
2. Set **`EMAIL_FROM`** in Vercel to `El Perri <almuerzo@yourdomain>`.

## 🟡 4. CI/CD repo settings
1. **Branch protection** on `main`: require the CI "Lint, Test & Build" check.
   (GitHub → Settings → Branches.)
2. If gitleaks reports a license error (org repos), add a **`GITLEAKS_LICENSE`** secret.

## 🟡 5. Backups
1. Add repo secret **`SUPABASE_DB_URL`** so `.github/workflows/backup.yml` can run
   the daily `pg_dump` (Supabase → Settings → Database → Connection string → URI).
2. Upgrade Supabase to enable **Point-in-Time Recovery** for minute-level RPO.

## 🟡 6. Error tracking (Sentry)
1. `npx @sentry/wizard@latest -i nextjs`, set **`SENTRY_DSN`** in Vercel.
2. Report errors from `app/global-error.jsx` and the cron route.
3. Then enable a cron heartbeat (Healthchecks.io / Better Stack) + uptime monitor.

## 🟢 7. Enable Vercel Analytics / Speed Insights
Already wired in code — just toggle **Analytics** and **Speed Insights** on in the
Vercel project dashboard.

## Minor code follow-ups (no external dependency)
- ~~`app/site.config.js` `email` field misused~~ — **done**: field is now empty with a
  comment; set the real business inbox when there is one.
- ~~Persist admin-managed promotions to Supabase~~ — **done**: `lib/promotionsStore.js`
  backs both `/api/promotions` and `/api/admin/promotions` (service-role writes,
  in-memory fallback without env keys).
- ~~`preload="none"` on the home video~~ — **done** (autoplay removed too); moving the
  9MB `public/historia.mp4` to Vercel Blob still pending (needs the Blob store).
- Make `lib/audit.js` insert into real audit tables (needs the tables created first).
- Swap remaining raw `<img>` (Nav/Footer/OrderAssistant) to `next/image`; adopt `next/font`.

## New since the audit (ordering funnel)
- **Square online ordering (recommended next step):** the business already uses
  Square for payments, so they can publish a free Square Online ordering page
  (Square Dashboard → Online), and paste its URL into `ORDER_URL` in
  `app/site.config.js`. Every "Ordenar" CTA then goes straight to Square
  checkout — real cards, their existing account, no new fees beyond Square's
  processing. WhatsApp stays as the fallback and the site-wide chat bubble.
  A deeper in-site checkout (Square Web Payments SDK on `/checkout`) is
  possible later but needs their Square developer credentials.
- Orders and catering quotes now flow through **WhatsApp** (`SITE.whatsapp` in
  `app/site.config.js` — currently the business phone). If the business number
  isn't on WhatsApp, either register it with WhatsApp Business or set the field
  to `""` to fall back to phone calls.
- Catering leads email to **`CATERING_EMAIL`** (set in Vercel alongside
  `RESEND_API_KEY`); until configured the form falls back to WhatsApp.
