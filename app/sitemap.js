import { SITE, localizedPath } from "./content";

export default function sitemap() {
  const pages = ["home", "menu", "wholesale", "about", "privacy", "terms"];
  return pages.flatMap((page) => ["es", "en"].map((locale) => ({
    url: `${SITE.website}${localizedPath(locale, page)}`,
    lastModified: new Date(),
    changeFrequency: page === "menu" ? "weekly" : "monthly",
    priority: page === "home" ? 1 : page === "menu" ? 0.9 : 0.7,
    alternates: { languages: { es: `${SITE.website}${localizedPath("es", page)}`, en: `${SITE.website}${localizedPath("en", page)}` } },
  })));
}
