import { MENU } from "../content";
import { ContactActions } from "./ContactActions";

/** MenuSections — Static bilingual menu sourced from the official restaurant menu. */
export function MenuSections({ locale = "es" }) {
  return (
    <>
      {MENU.map((section) => (
        <section className="menu-section" id={section.id} key={section.id}>
          <div className="section-heading section-heading--compact">
            <p className="eyebrow">{section.id === "mains" ? "31" : section.items.length}</p>
            <h2>{section.title[locale]}</h2>
          </div>
          <div className="menu-list">
            {section.items.map((entry) => (
              <article className="menu-item" key={entry.id}>
                <div>
                  <h3>{entry.name}</h3>
                  <p>{entry.description[locale]}</p>
                </div>
                <strong>{entry.price}</strong>
              </article>
            ))}
          </div>
        </section>
      ))}
      <section className="callout callout--center">
        <p className="eyebrow">{locale === "es" ? "Pedidos" : "Orders"}</p>
        <h2>{locale === "es" ? "¿Ya sabes qué se te antoja?" : "Know what you’re craving?"}</h2>
        <p>{locale === "es" ? "Llámanos o escríbenos por WhatsApp para confirmar disponibilidad y hacer tu pedido." : "Call or message us on WhatsApp to confirm availability and place your order."}</p>
        <ContactActions locale={locale} />
      </section>
    </>
  );
}
