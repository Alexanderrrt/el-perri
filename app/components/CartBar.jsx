"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getCart, subscribeToCart, cartCount, cartSubtotal } from "@/lib/cart";

/**
 * CartBar — floating "view my order" pill, visible on every page except
 * /checkout once the cart has items. Mirrors the localStorage cart in
 * lib/cart.js; the checkout page recomputes real totals server-side.
 */
export function CartBar() {
  const pathname = usePathname();
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getCart());
    return subscribeToCart(setItems);
  }, []);

  const count = cartCount(items);
  if (count === 0 || pathname?.startsWith("/checkout")) return null;

  return (
    <a href="/checkout" className="cart-bar">
      <span className="cart-bar__icon">🛒</span>
      <span className="cart-bar__count">{count}</span>
      <span className="cart-bar__total">${cartSubtotal(items).toFixed(2)}</span>
      <span className="cart-bar__cta">Ver mi pedido</span>
    </a>
  );
}
