import { SITE } from "../content";

/** ContactActions — Data-free order and inquiry links. */
export function ContactActions({ locale = "es", wholesale = false }) {
  const es = locale === "es";
  const message = wholesale
    ? (es ? "Hola, quiero información sobre tamales al por mayor." : "Hello, I would like information about wholesale tamales.")
    : (es ? "Hola, quiero hacer un pedido para recoger." : "Hello, I would like to place a pickup order.");
  const whatsapp = `${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
  return (
    <div className="button-row">
      <a className="button" href={SITE.phoneHref}>{es ? "Llamar ahora" : "Call now"}</a>
      <a className="button button--outline" href={whatsapp} target="_blank" rel="noreferrer">
        {es ? "Escribir por WhatsApp" : "Message on WhatsApp"}
      </a>
    </div>
  );
}
