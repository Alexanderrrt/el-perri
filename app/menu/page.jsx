import { Reveal, OrderButton } from "../components";
import { MENU_GROUPS, SITE } from "../site.config";

export const metadata = {
  title: `Menú · ${SITE.name}`,
  description:
    "El menú completo de El Perri Latin Food en San José: entradas, arepas rellenas, patacones, salchipapas, hamburguesas, conos de la casa y adiciones.",
};

export default function MenuPage() {
  return (
    <main>
      <header className="page-head">
        <p className="kicker">El menú</p>
        <h1 className="h1">Comida hecha con ❤️</h1>
        <p className="lead">{SITE.tagline}</p>
      </header>

      <section className="section" style={{ paddingTop: 24 }}>
        {MENU_GROUPS.map((group, gi) => (
          <Reveal key={group.group}>
            <div className="menu-section">
              <h2 data-num={String(gi + 1).padStart(2, "0")}>{group.group}</h2>
              {group.items.map((item) => (
                <div className="row" key={item.id}>
                  <div className="row-main">
                    <div className="row-name">
                      <h3>{item.name}</h3>
                      {item.tag && <span className="chip">{item.tag}</span>}
                    </div>
                    {item.desc && <p className="row-desc">{item.desc}</p>}
                  </div>
                  <span className="row-price">{item.price}</span>
                </div>
              ))}
            </div>
          </Reveal>
        ))}

        <Reveal>
          <p className="form-note">
            Los precios no incluyen impuestos. Las bebidas calientes están disponibles solo en
            invierno.
          </p>
          <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <OrderButton variant="primary" />
            <a href={SITE.mapUrl} className="btn btn-dark" target="_blank" rel="noopener noreferrer">
              Cómo llegar
            </a>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
