/**
 * Shared order pricing (server-only) — the single trusted source of truth for
 * what an order costs. Used by the web checkout (app/api/checkout/guest) and
 * the in-app AI assistant (lib/assistantBot.js) so neither channel can trust
 * a client- or model-supplied total: every price comes from the live menu,
 * every promo is revalidated, and tax is applied the same way everywhere.
 */
import { listMenuItems } from "./menuStore";
import { parsePrice } from "./price";
import { findActivePromo } from "./promotionsStore";
import { SITE } from "@/app/site.config";

/**
 * Recompute an order total from item ids + quantities.
 * @param {{id: string, name?: string, quantity: number}[]} items
 * @param {string|null} discountCode
 * @returns {Promise<{error: string} | {lines, subtotal, discount, promo, tax, total}>}
 */
export async function recomputeOrder(items, discountCode) {
  const menu = await listMenuItems();
  const byId = new Map(menu.map((m) => [m.id, m]));

  const lines = [];
  for (const { id, name, quantity } of items) {
    const menuItem = byId.get(id);
    if (!menuItem) return { error: `Item no disponible: ${name || id}` };
    const price = parsePrice(menuItem.price);
    if (price == null) return { error: `${menuItem.name} no está disponible para pedir en línea` };
    lines.push({ id, name: menuItem.name, price, quantity });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  let discount = 0;
  let promo = null;
  if (discountCode) {
    promo = await findActivePromo(discountCode);
    if (promo) {
      discount = promo.type === "fixed" ? promo.discount : subtotal * (promo.discount / 100);
    }
  }

  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * (SITE.TAX_RATE || 0);
  const total = Math.round((taxable + tax) * 100) / 100;

  return { lines, subtotal, discount, promo, tax, total };
}

/** Generate a human-readable order number, e.g. ORD-20260702-4201. */
export function makeOrderNumber() {
  return `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(
    Math.floor(Math.random() * 10000)
  ).padStart(4, "0")}`;
}
