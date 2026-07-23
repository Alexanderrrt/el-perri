import { SITE } from "./content";

export default function robots() {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE.website}/sitemap.xml`, host: SITE.website };
}
