# Remaining hand-off — items that need you

The audit remediation is mostly done in code (see git history). These remaining
items can't be completed from the codebase alone — they need your Supabase
dashboard, DNS registrar, billing, or third-party accounts. Ordered by priority.

## 🔴 1. Lock down Supabase RLS (security — highest priority)
**Why:** the anon key (shipped in the browser) can currently read every row,
including `subscribers` emails and `registered_users`. Passwords are now bcrypt
hashes (fixed in code), but emails are still exposed.

**Update:** `orders` and `whatsapp_sessions` are already fully hardened —
`db/supabase-schema.sql` creates both with no anon policy at all, since
`lib/ordersStore.js` and `lib/whatsappSession.js` only ever use the
service-role key. Nothing further needed for those two tables.

**Blocker (for the rest):** the admin panel and lunch features currently
**write** via the anon key from the browser. Locking RLS will break them
unless those writes move to server-side routes using the service-role key.
So do this in order:

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
- **In-site checkout with Square as the payment processor.** `/menu` now has a
  real cart (`lib/cart.js`, localStorage) and `/checkout` charges the card
  directly on the site — Square never redirects the customer away. The card
  field is Square's own **Web Payments SDK** (PCI-compliant, card numbers
  never touch our server); our API charges the resulting token via Square's
  **Payments API** (`lib/square.js`). To go live:
  1. developer.squareup.com → create/open an app → **Sandbox** tab first to
     test, then **Production** when ready.
  2. Set in Vercel: `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`,
     `SQUARE_ENVIRONMENT`, `NEXT_PUBLIC_SQUARE_APP_ID`,
     `NEXT_PUBLIC_SQUARE_LOCATION_ID`, `NEXT_PUBLIC_SQUARE_ENVIRONMENT`
     (see `.env.example` for exactly where each value comes from).
  3. Test with Square's sandbox test card `4111 1111 1111 1111` (any future
     expiry/CVV) before flipping to production credentials.
  4. Confirm the `TAX_RATE` in `app/site.config.js` (currently 9.375% for San
     José) with your accountant.
  5. **Apple Pay** (already built into `/checkout`): in the Square Developer
     Console → your app → **Apple Pay** → **Add Domain** (do it in both
     **Sandbox** and **Production** modes). Square auto-handles Apple's domain
     validation — no Apple merchant ID or `.well-known` file needed. The Apple
     Pay button only appears on Apple devices in Safari over HTTPS (not on
     `localhost`), and charges through the same Square path as the card.
  Without these env vars set, checkout still works as "pay at pickup" —
  useful for demos, but **not real payments** until Square is configured.
- ~~Orders are not yet written to a database~~ — **done**: the web checkout
  writes to the real `orders` table via `lib/ordersStore.js`; see the
  Órdenes Activas admin tab.
- Orders and catering quotes also flow through **WhatsApp** (`SITE.whatsapp`
  in `app/site.config.js` — currently the business phone) as a no-setup
  fallback and for items with non-numeric prices ("$17 / $18", "+$2") that
  the cart can't checkout online. If the business number isn't on WhatsApp,
  register it with WhatsApp Business or set the field to `""`.
- Catering leads email to **`CATERING_EMAIL`** (set in Vercel alongside
  `RESEND_API_KEY`); until configured the form falls back to WhatsApp.

## New: AI ordering assistant in the on-site chat
The site's **"¿Qué pido?"** chat bubble is now a real AI assistant. It answers
menu questions in Spanish and builds the cart by calling server-side tools
(`agregar_item`, `quitar_item`, `set_cantidad`) — the server validates every
item against the live menu and shared pricing (`lib/orderPricing.js`), so it
can't invent dishes or prices. When the cart has items, the chat shows a
**"Ver mi pedido y pagar"** button that hands off to `/checkout` (card / Apple
Pay via Square). WhatsApp stays as a click-to-chat "reach us" link.

> The earlier Meta WhatsApp Cloud API bot was **cancelled** — no Meta app,
> webhook, phone-number registration, or `WHATSAPP_*` API env vars needed.

**Only setup needed — the AI model API key (Groq free tier):**
1. console.groq.com → sign in → **API Keys** → **Create API Key** (starts `gsk_`).
2. Set in Vercel:
   - **`LLM_API_KEY`** = your `gsk_…` key
   - **`LLM_BASE_URL`** = `https://api.groq.com/openai/v1`
   - **`LLM_MODEL`** = `openai/gpt-oss-120b` (strong tool-calling; free)
Paste the key directly into the dashboard/env file — never into a chat with an
AI assistant, since that can leak it into logs. Free-tier limits (~1,000
requests/day) are plenty for a food truck. To switch providers later, just
change those three vars — no code change (DeepSeek: `sk-…` +
`https://api.deepseek.com` + `deepseek-chat`).

**Cost note:** each customer message can trigger a few LLM calls (tool-calling
loop, capped at 4 per message) — free on Groq's tier, but usage-metered if you
move to a paid provider. `/api/assistant` is rate-limited to 40 msgs/hour/IP.
