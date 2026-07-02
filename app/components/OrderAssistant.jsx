"use client";
import { useState, useRef, useEffect } from "react";
import { SITE, waLink } from "../site.config";
import { getCart, setCart, subscribeToCart, cartCount, cartSubtotal } from "@/lib/cart";

/**
 * OrderAssistant — the on-site "¿Qué pido?" AI chat.
 * A real conversational assistant (Groq via /api/assistant) that answers menu
 * questions and builds the localStorage cart by calling server-side tools.
 * The server validates every item against the live menu, so the model can't
 * invent dishes or prices. When the cart has items, a footer button hands off
 * to /checkout to pay (card / Apple Pay via Square). WhatsApp stays as an
 * alternate way to reach the business.
 */
const GREETING =
  "¡Hola! 🌭 Soy el asistente de El Perri. Dime qué se te antoja y te armo el pedido — o pregúntame qué recomiendo.";

const STARTERS = [
  "¿Qué me recomiendas?",
  "Algo dulce 🍦",
  "La más pedida",
];

export function OrderAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [cart, setCartState] = useState([]);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setCartState(getCart());
    return subscribeToCart(setCartState);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || isTyping) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.filter((m) => m.role === "user" || m.role === "assistant"),
          cart: getCart(),
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.cart)) setCart(data.cart);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "…" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Uy, se cayó la conexión 😅 Intenta de nuevo o llámanos al ${SITE.phone}.`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  const count = cartCount(cart);
  const subtotal = cartSubtotal(cart);
  const showStarters = messages.length === 1 && !isTyping;

  if (!open) {
    return (
      <button className="assistant-fab" onClick={() => setOpen(true)} aria-label="Abrir asistente: ¿qué pido?">
        <span className="dot" aria-hidden="true" />
        ¿Qué pido?
      </button>
    );
  }

  return (
    <div className="assistant-panel" role="dialog" aria-label="Asistente El Perri">
      <div className="assistant-head">
        {SITE.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={SITE.logo} alt="" aria-hidden="true" />
        )}
        <div>
          <div className="at">Asistente El Perri</div>
          <div className="as">Te ayudo a pedir</div>
        </div>
        <button className="ax" onClick={() => setOpen(false)} aria-label="Cerrar asistente">
          ×
        </button>
      </div>

      <div className="assistant-body">
        {messages.map((m, i) => (
          <div key={i} className={`assistant-msg ${m.role === "user" ? "user" : "bot"} fade-in`}>
            {m.content}
          </div>
        ))}

        {showStarters && (
          <div className="assistant-options fade-in">
            {STARTERS.map((s) => (
              <button key={s} className="assistant-opt" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {isTyping && (
          <div className="assistant-typing fade-in">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div className="assistant-foot">
        {count > 0 && (
          <a href="/checkout" className="assistant-cta">
            🛒 Ver mi pedido y pagar · {count} · ${subtotal.toFixed(2)}
          </a>
        )}
        <form className="assistant-input" onSubmit={onSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe lo que se te antoja…"
            aria-label="Mensaje para el asistente"
            maxLength={500}
          />
          <button type="submit" aria-label="Enviar" disabled={!input.trim() || isTyping}>
            ➤
          </button>
        </form>
        {SITE.whatsapp && (
          <a
            className="assistant-wa"
            href={waLink("Hola El Perri 👋 Tengo una pregunta.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            ¿Prefieres WhatsApp?
          </a>
        )}
      </div>
    </div>
  );
}
