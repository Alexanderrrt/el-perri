import { SITE } from "./site.config";

const base = (SITE.website || "https://elperrilatinfood.com").replace(/\/$/, "");

export default function sitemap() {
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/menu`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/nuestra-historia`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/catering`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
}
