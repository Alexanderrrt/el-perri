"use client";
import { useEffect, useRef, useState } from "react";
import { SITE, waLink } from "../site.config";
import { getCart, subscribeToCart, setQty, clearCart, cartSubtotal } from "@/lib/cart";
import { useAuth } from "@/lib/useAuth";
import { isSupabaseConfigured } from "@/lib/supabase";

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

const GOOGLE_SVG = (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.08 24.08 0 0 0 0 21.56l7.98-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

/**
 * CheckoutClient — cart summary, contact/fulfillment details, promo code,
 * and payment. Supports Google sign-in via Supabase Auth to auto-fill
 * customer info. Square Web Payments SDK handles card + Apple Pay.
 */
export function CheckoutClient() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState("pickup");
  const [street, setStreet] = useState("");
  const [apt, setApt] = useState("");
  const [city, setCity] = useState("San Jose");
  const [state, setState] = useState("CA");
  const [zip, setZip] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const streetRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [promoCode, setPromoCode] = useState("");
  const [promo, setPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [card, setCard] = useState(null);
  const [cardReady, setCardReady] = useState(false);
  const [paymentsReady, setPaymentsReady] = useState(false);
  const [applePay, setApplePay] = useState(null);
  const cardContainerRef = useRef(null);
  const paymentsRef = useRef(null);
  const authFilled = useRef(false);

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

  // Auto-fill form fields from Google profile (only once per sign-in).
  useEffect(() => {
    if (!user || authFilled.current) return;
    authFilled.current = true;
    if (user.name && !name) setName(user.name);
    if (user.email && !email) setEmail(user.email);
  }, [user, name, email]);

  // Reset the fill guard when user signs out.
  useEffect(() => {
    if (!user) authFilled.current = false;
  }, [user]);

  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Google Places Autocomplete for street address
  useEffect(() => {
    if (fulfillment !== "delivery" || !googleMapsKey || autocompleteRef.current) return;
    let cancelled = false;

    async function initAutocomplete() {
      if (!window.google?.maps?.places) {
        await new Promise((resolve, reject) => {
          if (document.querySelector('script[src*="maps.googleapis.com"]')) {
            const check = setInterval(() => {
              if (window.google?.maps?.places) { clearInterval(check); resolve(); }
            }, 100);
            return;
          }
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&libraries=places`;
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      if (cancelled || !streetRef.current) return;

      const ac = new window.google.maps.places.Autocomplete(streetRef.current, {
        componentRestrictions: { country: "us" },
        types: ["address"],
        fields: ["address_components", "formatted_address"],
      });

      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (!place.address_components) return;

        let streetNum = "", route = "", acCity = "", acState = "", acZip = "";
        for (const c of place.address_components) {
          const t = c.types[0];
          if (t === "street_number") streetNum = c.long_name;
          if (t === "route") route = c.long_name;
          if (t === "locality") acCity = c.long_name;
          if (t === "administrative_area_level_1") acState = c.short_name;
          if (t === "postal_code") acZip = c.long_name;
        }

        setStreet(`${streetNum} ${route}`.trim());
        if (acCity) setCity(acCity);
        if (acState) setState(acState);
        if (acZip) setZip(acZip);
        setAddressConfirmed(true);
      });

      autocompleteRef.current = ac;
    }

    initAutocomplete().catch(() => {});
    return () => { cancelled = true; };
  }, [fulfillment, googleMapsKey]);

  // Reset confirmation when address changes manually
  useEffect(() => {
    setAddressConfirmed(false);
  }, [street, city, state, zip]);

  const totals = computeTotals(items, promo);

  // Load Square's Web Payments SDK, keep the payments instance, attach the card.
  useEffect(() => {
    if (!squareEnabled || paymentsRef.current) return;
    let cancelled = false;

    async function init() {
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
      paymentsRef.current = payments;
      setPaymentsReady(true);
      const cardInstance = await payments.card();
      if (cancelled) return;
      await cardInstance.attach(cardContainerRef.current);
      setCard(cardInstance);
      setCardReady(true);
    }

    init().catch((err) => {
      console.error("[SQUARE] SDK load failed:", err);
      setError("No pudimos cargar el formulario de pago. Intenta de nuevo o llámanos.");
    });

    return () => {
      cancelled = true;
    };
  }, [squareEnabled, squareAppId, squareLocationId]);

  useEffect(() => {
    if (!squareEnabled || !paymentsReady || totals.total <= 0) return;
    let cancelled = false;

    async function initApplePay() {
      try {
        const paymentRequest = paymentsRef.current.paymentRequest({
          countryCode: "US",
          currencyCode: "USD",
          total: { amount: totals.total.toFixed(2), label: SITE.shortName || "El Perri" },
        });
        const ap = await paymentsRef.current.applePay(paymentRequest);
        if (!cancelled) setApplePay(ap);
      } catch {
        if (!cancelled) setApplePay(null);
      }
    }

    initApplePay();
    return () => {
      cancelled = true;
    };
  }, [squareEnabled, paymentsReady, totals.total]);

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

  const validate = () => {
    if (items.length === 0) return "Tu carrito está vacío.";
    if (!name.trim()) return "Escribe tu nombre.";
    if (!email.trim()) return "Escribe tu correo.";
    if (!phone.trim()) return "Escribe tu teléfono.";
    if (fulfillment === "delivery") {
      if (!street.trim()) return "Escribe la dirección de entrega.";
      if (!city.trim()) return "Escribe la ciudad.";
      if (!state.trim()) return "Escribe el estado.";
      if (!zip.trim() || !/^\d{5}$/.test(zip.trim())) return "Escribe un código postal válido (5 dígitos).";
    }
    return null;
  };

  const fullAddress = () => {
    const parts = [street.trim()];
    if (apt.trim()) parts[0] += `, ${apt.trim()}`;
    parts.push(`${city.trim()}, ${state.trim()} ${zip.trim()}`);
    return parts.join(", ");
  };

  const submitOrder = async (payment_token) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          fulfillment,
          delivery_address: fulfillment === "delivery" ? fullAddress() : "",
          delivery_notes: fulfillment === "delivery" ? deliveryNotes : "",
          marketing_consent: false,
          items: items.map((i) => ({ id: i.id, name: i.name, quantity: i.qty })),
          total: totals.total,
          discount_code: promo?.code || null,
          payment_token,
          csrfToken,
          auth_user_id: user?.id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No pudimos procesar tu pedido.");
        setSubmitting(false);
        return;
      }
      clearCart();
      const trackingParam = data.delivery?.trackingUrl
        ? `?tracking=${encodeURIComponent(data.delivery.trackingUrl)}`
        : "";
      window.location.href = `/order-confirmation/${data.orderNumber}${trackingParam}`;
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setSubmitting(false);
    }
  };

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const v = validate();
    if (v) return setError(v);

    let payment_token;
    if (squareEnabled) {
      if (!card) return setError("El formulario de pago aún está cargando.");
      const result = await card.tokenize();
      if (result.status !== "OK") return setError("Revisa los datos de tu tarjeta.");
      payment_token = result.token;
    }
    submitOrder(payment_token);
  };

  const handleApplePay = async () => {
    setError("");
    const v = validate();
    if (v) return setError(v);
    try {
      const result = await applePay.tokenize();
      if (result.status !== "OK") return;
      submitOrder(result.token);
    } catch {
      setError("No se pudo completar el pago con Apple Pay.");
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
    <form className="checkout-layout" onSubmit={handleCardSubmit}>
      <div className="checkout-cart">
        <h2 className="h2" style={{ fontSize: 22 }}>Tu pedido</h2>
        {items.map((item) => (
          <div className="checkout-line" key={item.id}>
            <div className="checkout-line__info">
              <span className="checkout-line__name">{item.name}</span>
              <span className="checkout-line__price">${(item.price * item.qty).toFixed(2)}</span>
            </div>
            <div className="qty-stepper">
              <button type="button" onClick={() => setQty(item.id, item.qty - 1)} aria-label="Quitar uno">-</button>
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
            <div><span>Descuento</span><span>-${totals.discount.toFixed(2)}</span></div>
          )}
          <div><span>Impuesto</span><span>${totals.tax.toFixed(2)}</span></div>
          <div className="checkout-totals__total"><span>Total</span><span>${totals.total.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="checkout-details">
        <h2 className="h2" style={{ fontSize: 22 }}>Tus datos</h2>

        {/* Google sign-in — auto-fills name + email */}
        {isSupabaseConfigured && !authLoading && (
          <div className="checkout-auth">
            {user ? (
              <div className="checkout-auth__user">
                {user.avatar_url && (
                  <img src={user.avatar_url} alt="" className="checkout-auth__avatar" referrerPolicy="no-referrer" />
                )}
                <span className="checkout-auth__name">{user.name || user.email}</span>
                <button type="button" className="checkout-auth__signout" onClick={signOut}>
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <button type="button" className="btn-google" onClick={signInWithGoogle}>
                {GOOGLE_SVG}
                <span>Continuar con Google</span>
              </button>
            )}
          </div>
        )}

        <div className="cat-form__field">
          <label htmlFor="co-name">Nombre *</label>
          <input id="co-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
        </div>
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
          <div className="delivery-fields">
            <div className="cat-form__field">
              <label htmlFor="co-street">Dirección *</label>
              <input
                id="co-street"
                ref={streetRef}
                type="text"
                required
                autoComplete={googleMapsKey ? "off" : "street-address"}
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Escribe tu dirección..."
              />
              {!googleMapsKey && (
                <span className="form-hint">Escribe la dirección completa</span>
              )}
            </div>
            <div className="cat-form__field">
              <label htmlFor="co-apt">Apt / Suite / Unidad</label>
              <input id="co-apt" type="text" autoComplete="address-line2" value={apt} onChange={(e) => setApt(e.target.value)} placeholder="Apt 4B (opcional)" />
            </div>
            <div className="delivery-fields__row">
              <div className="cat-form__field">
                <label htmlFor="co-city">Ciudad *</label>
                <input id="co-city" type="text" required autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="cat-form__field" style={{ maxWidth: 80 }}>
                <label htmlFor="co-state">Estado *</label>
                <input id="co-state" type="text" required autoComplete="address-level1" maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} />
              </div>
              <div className="cat-form__field" style={{ maxWidth: 110 }}>
                <label htmlFor="co-zip">ZIP *</label>
                <input id="co-zip" type="text" required autoComplete="postal-code" inputMode="numeric" maxLength={5} value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))} placeholder="95112" />
              </div>
            </div>

            {street && city && zip.length === 5 && (
              <div className={`delivery-confirm ${addressConfirmed ? "delivery-confirm--ok" : ""}`}>
                <span className="delivery-confirm__icon">{addressConfirmed ? "✅" : "📍"}</span>
                <div className="delivery-confirm__text">
                  <strong>{street}{apt ? `, ${apt}` : ""}</strong>
                  <span>{city}, {state} {zip}</span>
                </div>
                {!addressConfirmed && (
                  <button type="button" className="btn btn-small" onClick={() => setAddressConfirmed(true)}>
                    Confirmar
                  </button>
                )}
              </div>
            )}

            <div className="cat-form__field">
              <label htmlFor="co-notes">Instrucciones de entrega</label>
              <textarea id="co-notes" rows={2} value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} placeholder="Ej: portón negro, tocar timbre, dejar en la puerta..." maxLength={300} />
            </div>
          </div>
        )}

        <div className="checkout-payment">
          {squareEnabled ? (
            <>
              {applePay && (
                <>
                  <button
                    type="button"
                    className="apple-pay-button"
                    onClick={handleApplePay}
                    disabled={submitting}
                    aria-label="Pagar con Apple Pay"
                  />
                  <div className="checkout-or"><span>o paga con tarjeta</span></div>
                </>
              )}
              <label>Tarjeta</label>
              <div id="card-container" ref={cardContainerRef} className="square-card-container" />
              {!cardReady && <p className="form-note">Cargando el formulario de pago...</p>}
            </>
          ) : (
            <p className="cat-form__success">
              Paga al recoger o cuando llegue tu entrega — efectivo o tarjeta en persona.
            </p>
          )}
        </div>

        {error && <p className="cat-form__error">{error}</p>}

        <button type="submit" className="btn btn-primary btn-large" disabled={submitting || (squareEnabled && !cardReady)}>
          {submitting ? "Procesando..." : squareEnabled ? `Pagar $${totals.total.toFixed(2)}` : "Confirmar pedido"}
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
