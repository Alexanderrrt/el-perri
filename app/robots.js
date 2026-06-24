import { SITE } from "./site.config";

const base = (SITE.website || "https://elperrilatinfood.com").replace(/\/$/, "");

export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
