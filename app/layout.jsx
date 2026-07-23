import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { SITE } from "./content";
import "./globals.css";

export const metadata = {
  metadataBase: new URL(SITE.website),
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: "Tamales tolimenses, desayunos y comida colombiana en San José, con tamales al por mayor para Fontana y Los Ángeles.",
  applicationName: SITE.name,
  icons: { icon: "/media/logo.webp", apple: "/media/logo.webp" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    images: [{ url: "/media/hero-truck.webp", width: 765, height: 432, alt: SITE.name }],
  },
};

const restaurantSchema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: SITE.name,
  url: SITE.website,
  image: `${SITE.website}/media/hero-truck.webp`,
  telephone: "+1-559-943-6954",
  servesCuisine: ["Colombian", "Latin American"],
  priceRange: "$10–$30",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1302 S 1st St",
    addressLocality: "San Jose",
    addressRegion: "CA",
    postalCode: "95110",
    addressCountry: "US",
  },
  sameAs: [SITE.instagram],
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "21:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "08:00", closes: "21:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "08:00", closes: "16:00" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main-content">Saltar al contenido / Skip to content</a>
        <Header />
        <div id="main-content">{children}</div>
        <Footer />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }} />
        {process.env.NODE_ENV === "production" ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
      </body>
    </html>
  );
}
