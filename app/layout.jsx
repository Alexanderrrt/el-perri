import { Nav, Footer, OrderAssistant } from "./components";
import { SITE, IMAGES } from "./site.config";
import "./globals.css";

export const metadata = {
  metadataBase: new URL(SITE.website || "https://elperrilatinfood.com"),
  title: `${SITE.name} · Latin street food en ${SITE.city}`,
  description:
    "Comida colombiana en San José: arepas rellenas, patacones, salchipapas, hamburguesas, perros y jugos naturales. Ordena, visítanos o pregunta por catering.",
  icons: { icon: SITE.logo, apple: SITE.logo },
  openGraph: {
    title: SITE.name,
    description: "La felicidad hecha comida — Latin street food colombiano en San José, CA.",
    type: "website",
    locale: "es_US",
    images: [{ url: IMAGES.hero, width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: "La felicidad hecha comida — Latin street food colombiano en San José, CA.",
    images: [IMAGES.hero],
  },
};

export const viewport = {
  themeColor: "#100d09",
  width: "device-width",
  initialScale: 1,
};

// LocalBusiness / Restaurant structured data — strong local-SEO signal
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: SITE.name,
  image: SITE.website ? `${SITE.website}${IMAGES.hero}` : IMAGES.hero,
  servesCuisine: ["Colombian", "Latin American", "Street food"],
  priceRange: "$$",
  telephone: SITE.phone,
  url: SITE.website,
  address: {
    "@type": "PostalAddress",
    streetAddress: "960 S First St",
    addressLocality: "San Jose",
    addressRegion: "CA",
    postalCode: "95110",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    // approximate — refine with exact storefront coordinates when available
    latitude: 37.3301,
    longitude: -121.8830,
  },
  openingHours: "Mo-Su 12:00-23:00",
  sameAs: SITE.social?.instagram ? [SITE.social.instagram] : undefined,
  hasMenu: SITE.website ? `${SITE.website}/menu` : "/menu",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700&family=Playfair+Display+SC:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <div className="scroll-progress" aria-hidden="true" />
        <Nav />
        {children}
        <Footer />
        <OrderAssistant />
      </body>
    </html>
  );
}
