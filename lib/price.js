/**
 * Menu price parsing (isomorphic — used by the client cart and by the
 * checkout API to recompute totals server-side).
 *
 * Menu prices are display strings. Only simple single prices ("$16",
 * "$7.50") are purchasable online; multi-price ("$17 / $18") and add-on
 * ("+$2") strings return null and stay WhatsApp/phone-only.
 */
export function parsePrice(price) {
  if (typeof price === "number" && Number.isFinite(price) && price > 0) return price;
  if (typeof price !== "string") return null;
  const match = price.trim().match(/^\$(\d+(?:\.\d{1,2})?)$/);
  return match ? Number(match[1]) : null;
}
