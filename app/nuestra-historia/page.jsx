import { Slot, Reveal, OrderButton } from "../components";
import { SITE, VIDEO } from "../site.config";

export const metadata = {
  title: `Nuestra historia · ${SITE.name}`,
  description:
    "De food truck a local en San José — la historia de El Perri Latin Food: comida colombiana de calle, hecha con el corazón.",
};

const MILESTONES = [
  {
    phase: "El comienzo",
    title: "Un food truck y muchas ganas",
    text: "Arrancamos rodando por San José con un food truck y las recetas de casa. Un plato a la vez, la gente empezó a volver.",
  },
  {
    phase: "El sabor se corre",
    title: "De boca en boca",
    text: "Las arepas rellenas, los patacones con todo y las salchipapas cargadas se volvieron tema de conversación. La fila creció.",
  },
  {
    phase: "Hoy",
    title: "Local propio en S First St",
    text: "Abrimos nuestro local en el 960 S First St — y seguimos rodando el truck y llevando El Perri a tus eventos.",
  },
];

export default function Historia() {
  return (
    <main>
      <header className="page-head">
        <div className="tricolor-bar" aria-hidden="true" />
        <p className="kicker">Nuestra historia</p>
        <h1 className="h1">De Colombia<br />pal mundo.</h1>
        <p className="lead">{SITE.tagline}</p>
      </header>

      {/* INTRO SPLIT */}
      <section className="section">
        <div className="split">
          <Reveal>
            <div className="split-media"><Slot name="story" label="El Perri Latin Food" /></div>
          </Reveal>
          <Reveal delay={120}>
            <div className="prose">
              <div className="sec-head">
                <span className="sec-eyebrow" data-num="01">Mucho gusto</span>
                <h2 className="h2">Comida de casa, hecha con el corazón</h2>
              </div>
              <p>
                Somos una cocina familiar y colombiana de pura cepa. Hacemos las cosas como se hacen
                allá: con tiempo, con sazón y con suficiente comida para que nadie se levante con hambre.
              </p>
              <p>
                Lo que empezó como un sueño sobre cuatro ruedas hoy tiene casa propia — pero el sabor,
                la calidez y las ganas siguen siendo las mismas del primer día.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="band">
        <div className="section">
          <Reveal>
            <div className="sec-head">
              <span className="sec-eyebrow" data-num="02">El camino</span>
              <h2 className="h2">Un sueño que sigue creciendo</h2>
            </div>
          </Reveal>
          <div className="menu-grid">
            {MILESTONES.map((m, i) => (
              <Reveal key={m.title} delay={i * 90}>
                <article className="feature">
                  <span className="feature-wm" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <span className="chip">{m.phase}</span>
                  <div className="feature-head"><h3>{m.title}</h3></div>
                  <p>{m.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* VIDEO */}
      {VIDEO && (
        <section className="section">
          <Reveal>
            <div className="video-wrap">
              <video className="video" src={VIDEO.src} poster={VIDEO.poster} autoPlay muted loop playsInline controls />
            </div>
            {VIDEO.caption && <p className="lead" style={{ marginTop: 18 }}>{VIDEO.caption}</p>}
          </Reveal>
        </section>
      )}

      {/* CTA */}
      <section className="section" style={{ paddingTop: 0 }}>
        <Reveal>
          <hr className="tricolor-rule" style={{ marginBottom: 28 }} />
          <h2 className="h2" style={{ marginBottom: 18 }}>Pásate a comer</h2>
          <div className="section-actions" style={{ marginTop: 0 }}>
            <OrderButton variant="primary" />
            <a href="/menu" className="btn btn-dark">Ver el menú</a>
            <a href="/catering" className="btn btn-gold">Catering</a>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
