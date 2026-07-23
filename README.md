# El Gran Tamal Colombiano

Bilingual brochure website for the San Jose restaurant and the Fontana/Los
Angeles wholesale tamal operation.

## Stack

- Next.js 16 App Router
- React 18
- Vercel Analytics and Speed Insights
- Static local menu and media; no database or customer-data collection

## Local development

```bash
npm install
npm run dev
```

No environment variables are required.

## Verification

```bash
npm run verify
```

This runs ESLint, menu/content tests, and the production build.

## Content structure

- `app/content.js` — shared business details, hours, links, bilingual menu,
  locale paths, and media-source references.
- `app/components/PageViews.jsx` — shared bilingual page views.
- `public/media/` — optimized restaurant-controlled WebP assets.
- `docs/MEDIA-SOURCES.md` — source and rights record for every public asset.
- `docs/OWNERSHIP-HANDOFF.md` — agency operations and DNS cutover checklist.

## Routes

| Spanish | English |
|---|---|
| `/` | `/en` |
| `/menu` | `/en/menu` |
| `/mayoreo` | `/en/wholesale` |
| `/historia` | `/en/about` |
| `/privacy` | `/en/privacy` |
| `/terms` | `/en/terms` |

## Publishing

The agency manages GitHub and Vercel. Production changes go through a feature
branch and reviewed pull request. DNS is moved only after staging approval and
the checks in `docs/OWNERSHIP-HANDOFF.md` are complete.
