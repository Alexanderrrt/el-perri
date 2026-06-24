import { Slot, Reveal, OrderButton } from "../components";
import { SITE } from "../site.config";

export const metadata = {
  title: `Catering · ${SITE.name}`,
  description:
    "Lleva el sabor de El Perri a tu evento en San José: food truck, eventos privados y paquetes a tu medida. Comida colombiana para tu próxima reunión.",
};

const IconTruck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 17h4V5H2v12h2" /><path d="M14 9h4l3 3v5h-3" /><circle cx="7.5" cy="17.5" r="2" /><circle cx="17.5" cy="17.5" r="2" />
  </svg>
);
const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2.2Z" />
  </svg>
);
const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const OFFERINGS = [
  { icon: <IconTruck />, title: "Food truck en tu evento", text: "Llevamos el truck a tu fiesta, oficina o celebración y cocinamos en vivo para tus invitados." },
  { icon: <IconCalendar />, title: "Eventos privados", text: "Cumpleaños, quinceañeros, bodas y reuniones — sabor colombiano que nadie olvida." },
  { icon: <IconUsers />, title: "Paquetes a tu medida", text: "Armamos el menú según tu grupo y presupuesto: arepas, patacones, salchipapas, burgers y más." },
];

export default function Catering() {
  return (
    <main>
      <header className="page-head">
        <div className="tricolor-bar" aria-hidden="true" />
        <p className="kicker">Catering</p>
        <h1 className="h1">Tu evento,<br />con sabor colombiano.</h1>
        <p className="lead">
          ¿Tienes una reunión, fiesta o evento? Llevamos El Perri hasta donde estés — el mismo sabor de
          siempre, ahora para tu mesa de invitados.
        </p>
      </header>

      {/* OFFERINGS */}
      <section className="band">
        <div className="section">
          <Reveal>
            <div className="sec-head">
              <span className="sec-eyebrow" data-num="01">Cómo te ayudamos</span>
              <h2 className="h2">Para cada ocasión</h2>
            </div>
          </Reveal>
          <div className="info-grid">
            {OFFERINGS.map((o, i) => (
              <Reveal key={o.title} delay={i * 90}>
                <div className="info-card">
                  <span className="ico">{o.icon}</span>
                  <div>
                    <h4>{o.title}</h4>
                    <p>{o.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="section">
        <div className="split">
          <Reveal>
            <div className="split-media"><Slot name="catering" label="Catering El Perri" /></div>
          </Reveal>
          <Reveal delay={120}>
            <div className="prose">
              <div className="sec-head">
                <span className="sec-eyebrow" data-num="02">Cotiza tu evento</span>
                <h2 className="h2">Hablemos</h2>
              </div>
              <p>
                Cuéntanos la fecha, el lugar y cuántos invitados, y armamos una propuesta a tu medida.
                La forma más rápida es una llamada o un mensaje por Instagram.
              </p>
              <div className="callout" style={{ marginTop: 8 }}>
                <p style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span className="footer-contact"><IconPhone /></span>
                  <a href={SITE.phoneHref} className="footer-link" style={{ color: "var(--ink)", fontSize: 18 }}>
                    {SITE.phone}
                  </a>
                </p>
                <p style={{ margin: 0 }}>Lun–Dom · 12pm – 11pm</p>
              </div>
              <div className="section-actions" style={{ marginTop: 22 }}>
                <a href={SITE.phoneHref} className="btn btn-primary">Llámanos</a>
                {SITE.social?.instagram && (
                  <a href={SITE.social.instagram} className="btn btn-dark" target="_blank" rel="noopener noreferrer">
                    <IconInstagram /> Escríbenos
                  </a>
                )}
                <a href="/menu" className="btn btn-gold">Ver el menú</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
