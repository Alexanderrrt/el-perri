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
  Without these env vars set, checkout still works as "pay at pickup" —
  useful for demos, but **not real payments** until Square is configured.
- ~~Orders are not yet written to a database~~ — **done**: both the web
  checkout and the WhatsApp bot write to the real `orders` table via
  `lib/ordersStore.js`; see the Órdenes Activas admin tab.
- Orders and catering quotes also flow through **WhatsApp** (`SITE.whatsapp`
  in `app/site.config.js` — currently the business phone) as a no-setup
  fallback and for items with non-numeric prices ("$17 / $18", "+$2") that
  the cart can't checkout online. If the business number isn't on WhatsApp,
  register it with WhatsApp Business or set the field to `""`.
- Catering leads email to **`CATERING_EMAIL`** (set in Vercel alongside
  `RESEND_API_KEY`); until configured the form falls back to WhatsApp.

## New: AI ordering bot on WhatsApp + Órdenes Activas
A customer can now text the business WhatsApp number, hold a real conversation
in Spanish, and place an order — it lands directly in the admin dashboard's
new **🛵 Órdenes Activas** tab alongside web orders. The AI (DeepSeek) never
computes prices or invents menu items itself: it calls named tools
(`agregar_item`, `establecer_entrega`, `confirmar_pedido`, etc.), and the
server executes them against the real menu and the same pricing logic the web
checkout uses (`lib/orderPricing.js`). Fully built and ready — needs two
external accounts to actually receive/send WhatsApp messages:

**1. DeepSeek API key**
1. platform.deepseek.com → API keys → create one.
2. Set **`DEEPSEEK_API_KEY`** in Vercel (and `.env.local` for local testing).
   Paste it directly into the env file/dashboard — never into a chat
   conversation with an AI assistant, since that can leak it into logs.

**2. Meta WhatsApp Business Cloud API** (the official API — different from the
regular WhatsApp Business app already used for the site's click-to-chat links)
1. developer.facebook.com → My Apps → **Create App** → type "Business" → add
   the **WhatsApp** product.
2. Meta gives you a **temporary access token** and a **test phone number**
   immediately (free) — enough to fully test the bot before using your real
   business number. Note the **Phone Number ID** shown on that page.
3. App Settings → Basic → copy the **App Secret**.
4. Make up a random string for **`WHATSAPP_VERIFY_TOKEN`** (anything — you
   choose it, Meta just echoes it back once to prove you own the endpoint).
5. Set in Vercel: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`,
   `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` (see `.env.example`).
6. Deploy (the webhook needs a public HTTPS URL — `localhost` won't work
   without a tunnel like ngrok for local testing).
7. Meta app dashboard → WhatsApp → Configuration → **Webhook**: URL =
   `https://<your-domain>/api/whatsapp/webhook`, verify token = whatever you
   set above → **Verify and save** → subscribe to the **messages** field.
8. While testing, set **`WHATSAPP_ALLOWLIST`** to your own number so only you
   get bot replies; remove it when ready to go live to real customers.
9. Send "Hola" from the allowlisted number to the test number shown in step 2
   — you should get a reply, and a confirmed order should appear in
   Órdenes Activas.
10. When ready for production: WhatsApp → API Setup → add and verify the real
    business phone number, generate a **permanent** access token (temporary
    ones expire in 24h), and swap `WHATSAPP_PHONE_NUMBER_ID` +
    `WHATSAPP_ACCESS_TOKEN` to the production values.

**Cost note:** each customer message can trigger a few DeepSeek API calls
(tool-calling loop, capped at 4 per message) — inexpensive at DeepSeek's
pricing, but it is a paid key with real usage once live.
