import { SITE, waLink } from "../site.config";

/**
 * OrderButton — the site's primary "Ordenar" CTA.
 * Destination priority: ORDER_URL (Toast/DoorDash/etc.) → WhatsApp chat
 * with a prefilled order message → plain phone call. Always actionable.
 */
export function OrderButton({ variant = "primary" }) {
  const className = variant === "nav" ? "btn btn-nav" : "btn btn-primary";
  const wa = waLink("Hola El Perri 👋 Quiero hacer un pedido.");
  const href = SITE.ORDER_URL || wa || SITE.phoneHref;
  const external = Boolean(SITE.ORDER_URL || wa);

  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      Ordenar ahora
    </a>
  );
}
