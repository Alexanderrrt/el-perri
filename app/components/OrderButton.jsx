import { SITE } from "../site.config";

export function OrderButton({ variant = "primary" }) {
  const hasUrl = Boolean(SITE.ORDER_URL);
  const className = variant === "nav" ? "btn btn-nav" : "btn btn-primary";

  if (hasUrl) {
    return (
      <a href={SITE.ORDER_URL} className={className} target="_blank" rel="noopener noreferrer">
        Ordenar ahora
      </a>
    );
  }

  return (
    <a href="#order" className={className}>
      Ordenar <span className="soon">Próximamente</span>
    </a>
  );
}
