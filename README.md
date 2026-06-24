# El Restaurante El Perri — website

Next.js (App Router) site for a Colombian restaurant in San José, CA.
Mobile-first, no UI dependencies, all styling in `app/globals.css`.

## Run it
```bash
npm install
npm run dev      # http://localhost:3000
```

## Pages
- `/`           Home — intro, featured plates, Order Now
- `/menu`       Full menu grouped by category
- `/catering`   Catering pitch + inquiry form (opens email; wire to a backend later)
- `/historia`   The story / about

## Edit everything in ONE place
Open **`app/site.config.js`**:
- `SITE.ORDER_URL`  → paste your ordering link (Toast/Square/etc.). Empty = button shows "pronto".
- `SITE.phone / address / hours / email` → your real details (replace the [brackets]).
- `IMAGES`          → put photos in `/public`, then set e.g. `hero: "/hero.jpg"`.
- `MENU_GROUPS`     → dishes, prices, descriptions.
- `FEATURED`        → which 3 dishes show on the home page.

Photo slots show a gradient placeholder until you add real images, so the
layout always looks finished.

## Notes
- Catering form currently opens the visitor's email client pre-filled.
  When you have a host with a backend, swap `handleSubmit` for a POST to your API.
- For best image performance later, switch `<img>` in `Slot` to `next/image`.

## Design system (ui-ux-pro-max)

This build follows the ui-ux-pro-max skill's recommendations for a restaurant:

- **Style:** Vibrant & Block-based — bold color, generous section gaps, block cards.
- **Type:** Playfair Display SC (small-caps serif headings) + Karla (body) — the
  skill's "Restaurant Menu" pairing. Loaded via Google Fonts in `app/layout.jsx`.
- **Color tokens** (in `:root` of `globals.css`): primary `#dc2626`, accent `#a16207`,
  background `#fef2f2`, foreground `#450a0a`. Everything references tokens — change
  the brand by editing `:root` only.
- **Accessibility:** all text combinations verified ≥4.5:1 WCAG AA (muted text and
  red-on-light text were darkened to pass). Focus rings use the ring token. Touch
  targets ≥44px. `prefers-reduced-motion` respected.
- **Motion:** interaction transitions 200–250ms; card hover lift; scroll reveals 350ms.

The Colombian tricolor stripe on the hero is an intentional cultural cue kept on top
of the generated palette.
