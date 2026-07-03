/** @type {import('next').NextConfig} */

// Content-Security-Policy applied to HTML pages. Note: Next.js App Router
// injects inline hydration scripts and the site is statically prerendered +
// edge-cached, so a per-request nonce isn't viable here; script-src therefore
// allows 'unsafe-inline'. The rest of the policy still meaningfully constrains
// framing, base-uri, form-action, object/embed, and source origins.
const isDev = process.env.NODE_ENV !== "production";
const PAGE_CSP = [
  "default-src 'self'",
  // 'unsafe-eval' is added only in dev so Next.js HMR/debug tooling works;
  // production gets the stricter policy without it.
  // Square's Web Payments SDK (checkout card field) loads from *.squarecdn.com
  // and spins up its tokenization worker via a same-origin blob: script.
  `script-src 'self' 'unsafe-inline' blob: https://www.instagram.com https://*.squarecdn.com${isDev ? " 'unsafe-eval'" : ""}`,
  // card-wrapper.css is fetched from squarecdn for the card field's styling.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.squarecdn.com",
  "font-src 'self' https://fonts.gstatic.com https://*.squarecdn.com data:",
  "img-src 'self' data: blob: https: https://*.googleusercontent.com",
  "media-src 'self' https:",
  // connect-src covers the SDK's own PCI-scoped tokenization calls, plus the
  // Sentry endpoint the SDK itself reports errors to.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.instagram.com https://pci-connect.squareup.com https://pci-connect.squareupsandbox.com https://*.ingest.sentry.io",
  // Instagram's official embed.js renders each post inside an iframe from
  // instagram.com/cdninstagram.com — required for the homepage reels section.
  // Square's card field also renders inside a same-origin-locked iframe.
  "frame-src https://www.instagram.com https://*.cdninstagram.com https://*.squarecdn.com https://*.squareup.com https://accounts.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

// Security headers shared by API responses and HTML pages.
const BASE_SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    deviceSizes: [360, 640, 750, 1080, 1200, 1920],
  },
  async headers() {
    return [
      {
        // API routes: CORS preflight support + security headers + strict CSP
        // (JSON responses don't execute scripts, so the strict policy is safe).
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Forwarded-Host, X-URL-Scheme, x-middleware-preflight, Content-Type, Authorization",
          },
          { key: "Access-Control-Max-Age", value: "86400" },
          ...BASE_SECURITY_HEADERS,
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none';",
          },
        ],
      },
      {
        // Long-lived caching for static media in /public (un-hashed filenames,
        // so a long max-age + stale-while-revalidate rather than immutable).
        source:
          "/:all*(jpg|jpeg|png|gif|webp|avif|svg|ico|mp4|webm|woff|woff2|ttf|otf)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
        ],
      },
      {
        // HTML pages: full security header set including a page-appropriate CSP.
        // Excludes /.well-known so Apple Pay domain verification gets no extra
        // headers that could confuse Square's automated verifier.
        source: "/((?!\\.well-known).*)",
        headers: [
          ...BASE_SECURITY_HEADERS,
          { key: "Content-Security-Policy", value: PAGE_CSP },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
