"use client";
import { useState } from "react";
import { SITE, waLink } from "../site.config";

/**
 * CateringForm — quote-request form on /catering.
 * Posts the lead to /api/catering. If the server can't email it (Resend not
 * configured yet), falls back to a prefilled WhatsApp message with the same
 * details so no lead is ever lost.
 */
export function CateringForm() {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | fallback | error
  const [error, setError] = useState("");
  const [fallbackHref, setFallbackHref] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const lead = {
      name: (fd.get("name") || "").trim(),
      phone: (fd.get("phone") || "").trim(),
      date: fd.get("date") || "",
      guests: (fd.get("guests") || "").trim(),
      eventType: fd.get("eventType") || "",
      message: (fd.get("message") || "").trim(),
    };

    setStatus("sending");
    setError("");

    try {
      const res = await fetch("/api/catering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.details?.[0]?.message || data?.error || "No pudimos enviar tu solicitud.");
        setStatus("error");
        return;
      }

      if (data.sent) {
        setStatus("sent");
        form.reset();
      } else {
        // Email not configured server-side — hand the same lead to WhatsApp
        const wa = waLink(
          `Hola El Perri 👋 Quiero cotizar catering:\n` +
            `• Nombre: ${lead.name}\n• Teléfono: ${lead.phone}\n` +
            `• Fecha: ${lead.date || "—"}\n• Invitados: ${lead.guests || "—"}\n` +
            `• Evento: ${lead.eventType || "—"}\n• Detalles: ${lead.message || "—"}`
        );
        setFallbackHref(wa);
        setStatus(wa ? "fallback" : "sent");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo o llámanos.");
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <p className="cat-form__success">
        ¡Recibido! 🎉 Te contactamos pronto para armar tu propuesta. Si es urgente, llámanos al{" "}
        <a href={SITE.phoneHref} style={{ color: "inherit" }}>{SITE.phone}</a>.
      </p>
    );
  }

  if (status === "fallback") {
    return (
      <div className="cat-form">
        <p className="cat-form__success">
          ¡Listo! Envíanos tu solicitud por WhatsApp con un clic — ya va con todos tus datos.
        </p>
        <a href={fallbackHref} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
          Enviar por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form className="cat-form" onSubmit={handleSubmit}>
      <div className="cat-form__grid">
        <div className="cat-form__field">
          <label htmlFor="cat-name">Nombre *</label>
          <input id="cat-name" name="name" required minLength={2} maxLength={120} placeholder="Tu nombre" />
        </div>
        <div className="cat-form__field">
          <label htmlFor="cat-phone">Teléfono *</label>
          <input id="cat-phone" name="phone" type="tel" required maxLength={20} placeholder="(408) 555-0123" />
        </div>
        <div className="cat-form__field">
          <label htmlFor="cat-date">Fecha del evento</label>
          <input id="cat-date" name="date" type="date" />
        </div>
        <div className="cat-form__field">
          <label htmlFor="cat-guests">Nº de invitados</label>
          <input id="cat-guests" name="guests" inputMode="numeric" maxLength={20} placeholder="50" />
        </div>
        <div className="cat-form__field cat-form__field--full">
          <label htmlFor="cat-type">Tipo de evento</label>
          <select id="cat-type" name="eventType" defaultValue="">
            <option value="">Elige una opción…</option>
            <option>Cumpleaños</option>
            <option>Quinceañero</option>
            <option>Boda</option>
            <option>Evento de empresa</option>
            <option>Food truck en mi evento</option>
            <option>Otro</option>
          </select>
        </div>
        <div className="cat-form__field cat-form__field--full">
          <label htmlFor="cat-message">Cuéntanos más</label>
          <textarea
            id="cat-message"
            name="message"
            maxLength={2000}
            placeholder="Lugar, horario, platos que te gustaría, presupuesto aproximado…"
          />
        </div>
      </div>
      {error && <p className="cat-form__error">{error}</p>}
      <div className="section-actions" style={{ marginTop: 4 }}>
        <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
          {status === "sending" ? "Enviando…" : "Pedir cotización"}
        </button>
      </div>
      <p className="form-note">Solo usamos tus datos para responderte sobre tu evento.</p>
    </form>
  );
}
