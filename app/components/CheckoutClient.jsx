"use client";
import { useEffect, useRef, useState } from "react";
import { SITE, waLink } from "../site.config";
import { getCart, subscribeToCart, setQty, clearCart, cartSubtotal } from "@/lib/cart";

const SQUARE_SDK_SRC =
  process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === "production"
    ? "https://web.squarecdn.com/v1/square.js"
    : "https://sandbox.web.squarecdn.com/v1/square.js";

function computeTotals(items, promo) {
  const subtotal = cartSubtotal(items);
  let discount = 0;
  if (promo) {
    discount = promo.type === "fixed" ? promo.discount : subtotal * (promo.discount / 100);
  }
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * (SITE.TAX_RATE || 0);
  const total = Math.round((taxable + tax) * 100) / 100;
  return { subtotal, discount, tax, total };
}

/**
 * CheckoutClient — cart summary, contact/fulfillment details, promo code,
 * and payment. When NEXT_PUBLIC_SQUARE_APP_ID is set, Square's Web Payments
 * SDK renders a PCI-compliant card field and tokenizes the card in the
 * browser; the token (never the card number) is sent to our API, which
 * charges it server-side. Without Square configured, checkout proceeds as
 * "pay at pickup".
 */
export function CheckoutClient() {
  const [items, setItems] = useState([]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState("pickup");
  const [address, setAddress] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promo, setPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [card, setCard] = useState(null);
  const [cardReady, setCardReady] = useState(false);
  const cardContainerRef = useRef(null);

  const squareAppId = process.env.NEXT_PUBLIC_SQUARE_APP_ID;
  const squareLocationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
  const squareEnabled = Boolean(squareAppId && squareLocationId);

  useEffect(() => {
    setItems(getCart());
    const unsubscribe = subscribeToCart(setItems);
    fetch("/api/csrf-token")
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken))
      .catch(() => {});
    return unsubscribe;
  }, []);

  // Load Square's Web Payments SDK and attach the card field once.
  useEffect(() => {
    if (!squareEnabled || card) return;
    let cancelled = false;

    async function attachCard() {
      if (!window.Square) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = SQUARE_SDK_SRC;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      if (cancelled || !window.Square) return;
      const payments = window.Square.payments(squareAppId, squareLocationId);
      const cardInstance = await payments.card();
      if (cancelled) return;
      await cardInstance.attach(cardContainerRef.current);
      setCard(cardInstance);
      setCardReady(true);
    }

    attachCard().catch((err) => {
      console.error("[SQUARE] SDK load failed:", err);
      setError("No pudimos cargar el formulario de pago. Intenta de nuevo o llámanos.");
    });

    return () => {
      cancelled = true;
    };
  }, [squareEnabled, squareAppId, squareLocationId, card]);

  const validatePromo = async () => {
    setPromoError("");
    if (!promoCode.trim()) return;
    try {
      const res = await fetch(`/api/promotions?code=${encodeURIComponent(promoCode)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPromoError("Código inválido o vencido");
        setPromo(null);
        return;
      }
      setPromo(data.promo);
    } catch {
      setPromoError("No pudimos validar el código");
    }
  };

  const totals = computeTotals(items, promo);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Tu carrito está vacío.");
      return;
    }
    if (fulfillment === "delivery" && address.trim().length < 5) {
      setError("Escribe una dirección de entrega válida.");
      return;
    }

    setSubmitting(true);
    try {
      let payment_token;
      if (squareEnabled) {
        if (!card) {
          setError("El formulario de pago aún está cargando.");
          setSubmitting(false);
          return;
        }
        const result = await card.tokenize();
        if (result.status !== "OK") {
          setError("Revisa los datos de tu tarjeta.");
          setSubmitting(false);
          return;
        }
        payment_token = result.token;
      }

      const res = await fetch("/api/checkout/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          fulfillment,
          delivery_address: fulfillment === "delivery" ? address : "",
          marketing_consent: false,
          items: items.map((i) => ({ id: i.id, name: i.name, quantity: i.qty })),
          total: totals.total,
          discount_code: promo?.code || null,
          payment_token,
          csrfToken,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No pudimos procesar tu pedido.");
        setSubmitting(false);
        return;
      }

      clearCart();
      window.location.href = `/order-confirmation/${data.orderNumber}`;
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="checkout-empty">
        <p className="lead">Tu carrito está vacío.</p>
        <a href="/menu" className="btn btn-primary">Ver el menú</a>
      </div>
    );
  }

  return (
    <form className="checkout-layout" onSubmit={handleSubmit}>
      <div className="checkout-cart">
        <h2 className="h2" style={{ fontSize: 22 }}>Tu pedido</h2>
        {items.map((item) => (
          <div className="checkout-line" key={item.id}>
            <div className="checkout-line__info">
              <span className="checkout-line__name">{item.name}</span>
              <span className="checkout-line__price">${(item.price * item.qty).toFixed(2)}</span>
            </div>
            <div className="qty-stepper">
              <button type="button" onClick={() => setQty(item.id, item.qty - 1)} aria-label="Quitar uno">−</button>
              <span>{item.qty}</span>
              <button type="button" onClick={() => setQty(item.id, item.qty + 1)} aria-label="Agregar uno">+</button>
            </div>
          </div>
        ))}

        <div className="checkout-promo">
          <input
            type="text"
            placeholder="Código promocional"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            disabled={Boolean(promo)}
          />
          <button type="button" onClick={validatePromo} className="btn btn-small" disabled={Boolean(promo)}>
            Aplicar
          </button>
        </div>
        {promoError && <p className="cat-form__error">{promoError}</p>}
        {promo && <p className="form-note" style={{ color: "#14713d" }}>✓ {promo.code} aplicado</p>}

        <div className="checkout-totals">
          <div><span>Subtotal</span><span>${totals.subtotal.toFixed(2)}</span></div>
          {totals.discount > 0 && (
            <div><span>Descuento</span><span>−${totals.discount.toFixed(2)}</span></div>
          )}
          <div><span>Impuesto</span><span>${totals.tax.toFixed(2)}</span></div>
          <div className="checkout-totals__total"><span>Total</span><span>${totals.total.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="checkout-details">
        <h2 className="h2" style={{ fontSize: 22 }}>Tus datos</h2>

        <div className="cat-form__field">
          <label htmlFor="co-email">Correo *</label>
          <input id="co-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
        </div>
        <div className="cat-form__field">
          <label htmlFor="co-phone">Teléfono *</label>
          <input id="co-phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(408) 555-0123" />
        </div>

        <div className="fulfillment-toggle">
          <button type="button" className={fulfillment === "pickup" ? "active" : ""} onClick={() => setFulfillment("pickup")}>
            Recoger
          </button>
          <button type="button" className={fulfillment === "delivery" ? "active" : ""} onClick={() => setFulfillment("delivery")}>
            Entrega
          </button>
        </div>

        {fulfillment === "delivery" && (
          <div className="cat-form__field">
            <label htmlFor="co-address">Dirección de entrega *</label>
            <input id="co-address" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, San Jose, CA" />
          </div>
        )}

        <div className="checkout-payment">
          {squareEnabled ? (
            <>
              <label>Tarjeta</label>
              <div id="card-container" ref={cardContainerRef} className="square-card-container" />
              {!cardReady && <p className="form-note">Cargando el formulario de pago…</p>}
            </>
          ) : (
            <p className="cat-form__success">
              Paga al recoger o cuando llegue tu entrega — efectivo o tarjeta en persona.
            </p>
          )}
        </div>

        {error && <p className="cat-form__error">{error}</p>}

        <button type="submit" className="btn btn-primary btn-large" disabled={submitting || (squareEnabled && !cardReady)}>
          {submitting ? "Procesando…" : squareEnabled ? `Pagar $${totals.total.toFixed(2)}` : "Confirmar pedido"}
        </button>

        {SITE.whatsapp && (
          <a
            href={waLink(
              `Hola El Perri 👋 Quiero confirmar mi pedido:\n${items
                .map((i) => `• ${i.name} x${i.qty}`)
                .join("\n")}\nTotal: $${totals.total.toFixed(2)}`
            )}
            className="link-accent"
            style={{ display: "block", textAlign: "center", marginTop: 12 }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Prefiero confirmar por WhatsApp
          </a>
        )}
      </div>
    </form>
  );
}
