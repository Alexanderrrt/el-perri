# Agency ownership and launch handoff

## Ownership model

- The agency owns and administers GitHub and Vercel.
- The restaurant receives approved content/operations access through the
  agency; no infrastructure account is being transferred.
- This brochure site has no database, login, payment, email, delivery, or
  customer-record system.
- Legacy customer data and credentials remain outside this website. Do not
  delete the old data without separate written authorization.

## Required owner confirmation before launch

- [ ] The San Jose storefront at 1302 S 1st St remains active.
- [ ] Hours: Monday closed; Tuesday–Friday 9–9; Saturday 8–9; Sunday 8–4.
- [ ] Fontana/Los Angeles wholesale service is part of the same business.
- [ ] Phone/WhatsApp number is (559) 943-6954.
- [ ] All 31 mains, 15 beverages, 20 add-ons, descriptions, and prices are current.
- [ ] Lechona and Tamal con Lechona remain omitted until confirmed.
- [ ] The restaurant authorizes reuse of official-site and Instagram media.
- [ ] A production DNS cutover window and rollback contact are assigned.

## Vercel configuration

1. Use the agency-managed Vercel project connected to this repository.
2. Remove all inherited Supabase, Resend, Square, Uber Direct, Google Maps,
   LLM, cron, and admin secrets from Production, Preview, and Development.
3. Deploy the feature branch to Preview and complete visual acceptance.
4. Keep the last legacy deployment available for agency-only rollback until the
   new domain is stable.

## DNS cutover

1. Record the current apex, `www`, mail, and verification records.
2. Lower relevant TTLs at least 24 hours before cutover.
3. Add `elgrantamalcolombianoca.com` and `www` to Vercel.
4. Apply only the DNS values Vercel displays; do not alter mail records.
5. Verify HTTPS, apex/`www` canonical behavior, sitemap, robots, and all routes.
6. Restore recorded DNS values if launch acceptance fails.

## Post-launch checks

- Confirm every Spanish and English route on desktop and mobile.
- Verify phone, WhatsApp, Instagram, and Google Maps links.
- Check Vercel Analytics/Speed Insights and browser console errors.
- Reconfirm operating hours and menu quarterly.
