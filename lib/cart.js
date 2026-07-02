/**
 * Client-side cart — localStorage persistence + subscribe pattern
 * (mirrors lib/menuStore.js). Items: [{ id, name, price(number), qty }].
 * Server code must never trust these values; the checkout API recomputes
 * every price from the live menu.
 */
import { parsePrice } from "./price";

const LS_KEY = "elperri_cart";
const listeners = new Set();

function read() {
  if (typeof window === "undefined") return [];
  try {
    const items = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function write(items) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
  listeners.forEach((fn) => fn(items));
}

export function getCart() {
  return read();
}

/** Add one unit of a menu item. No-op for items without a parseable price. */
export function addItem({ id, name, price }) {
  const parsed = parsePrice(price);
  if (parsed == null) return;
  const items = read();
  const existing = items.find((i) => i.id === id);
  if (existing) existing.qty += 1;
  else items.push({ id, name, price: parsed, qty: 1 });
  write(items);
}

/** Set quantity; qty <= 0 removes the item. */
export function setQty(id, qty) {
  let items = read();
  if (qty <= 0) {
    items = items.filter((i) => i.id !== id);
  } else {
    const item = items.find((i) => i.id === id);
    if (item) item.qty = Math.min(qty, 50);
  }
  write(items);
}

export function clearCart() {
  write([]);
}

/**
 * Replace the whole cart (used by the AI assistant, which returns the
 * authoritative menu-validated cart each turn). Normalizes shape and notifies
 * listeners so the CartBar updates live.
 */
export function setCart(items) {
  const clean = (Array.isArray(items) ? items : [])
    .map((i) => ({
      id: i.id,
      name: i.name,
      price: parsePrice(i.price),
      qty: Math.min(Math.max(1, Math.floor(i.qty) || 1), 50),
    }))
    .filter((i) => i.id && i.price != null);
  write(clean);
}

/** Subscribe to cart changes. Returns an unsubscribe function. */
export function subscribeToCart(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function cartCount(items = read()) {
  return items.reduce((n, i) => n + i.qty, 0);
}

export function cartSubtotal(items = read()) {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}
