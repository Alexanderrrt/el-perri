import Image from "next/image";
import { Slot, Reveal, OrderButton, InstagramReels } from "./components";
import WelcomeBubble from "./components/WelcomeBubble";
import AdminShortcut from "./components/AdminShortcut";
import { FEATURED, MENU_GROUPS, SITE, GALLERY, VIDEO, REELS } from "./site.config";

const IgIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

// flatten menu to look up featured items by id
const ALL = MENU_GROUPS.flatMap((g) => g.items);
const featuredItems = FEATURED.map((id) => ALL.find((i) => i.id === id)).filter(Boolean);

// signature ticker phrases
const MARQUEE = [
  "Arepas Rellenas", "Patacones con Todo", "Salchipapas Cargadas",
  "Hamburguesas Artesanales", "Conos de la Casa", "Jugos Naturales", "De Colombia pal Mundo",
];

export default function Home() {
  return (
    <>
      <AdminShortcut />
      <WelcomeBubble />
      <main>
      {/* HERO */}
      <section className="hero">
        <div className="flag" aria-hidden="true"><span /><span /><span /></div>
        <div className="hero-bg"><Slot name="hero" label="Plato de comida colombiana servido en El Perri" priority sizes="100vw" /></div>
        <div className="hero-scrim" />
        <div className="hero-inner">
          <p className="eyebrow">{SITE.city} · Latin street food</p>
          <h1 className="hero-title">La felicidad<br /><em>hecha comida.</em></h1>
          <p className="hero-sub">
            Arepas rellenas, patacones con todo, salchipapas cargadas y hamburguesas que se
            volvieron leyenda. De Colombia pal mundo — bienvenido a El Perri.
          </p>
          <div className="hero-actions">
            <OrderButton variant="primary" />
            <a href="/menu" className="btn btn-ghost">Ver el menú</a>
          </div>
        </div>
        <div className="scroll-cue" aria-hidden="true"><span /></div>
      </section>

      {/* MARQUEE */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((word, i) => (
            <span key={i}>{word}</span>
          ))}
        </div>
      </div>

      {/* STORY */}
      <section className="section">
        <Reveal>
          <div className="sec-head">
            <span className="sec-eyebrow" data-num="01">Mucho gusto</span>
            <h2 className="h2">Lo que empezó en un food truck</h2>
          </div>
          <p className="lead">
            Arrancamos con un food truck llevando sabor colombiano por todo San José, y un plato a la
            vez nos ganamos a la gente. Hoy tenemos local en S First St — y seguimos rodando el truck
            y haciendo catering. Pasa a comer, ordena para llevar, o pregúntanos por tu próximo evento.
          </p>
        </Reveal>
      </section>

      {/* FEATURED PLATES */}
      <section className="section" style={{ paddingTop: 0 }}>
        <Reveal>
          <div className="sec-head">
            <span className="sec-eyebrow" data-num="02">Algunos favoritos</span>
            <h2 className="h2">Lo que la gente pide</h2>
          </div>
        </Reveal>
        <div className="menu-grid">
          {featuredItems.map((item, i) => (
            <Reveal key={item.id} delay={i * 90}>
              <article className="feature">
                <span className="feature-wm" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                {item.tag && <span className="chip">{item.tag}</span>}
                <div className="feature-head">
                  <h3>{item.name}</h3>
                  <span className="price">{item.price}</span>
                </div>
                <p>{item.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal delay={140}>
          <div className="section-actions">
            <a href="/menu" className="btn btn-dark">Ver el menú completo</a>
            <OrderButton variant="primary" />
          </div>
        </Reveal>
      </section>

      {/* QUOTE BAND */}
      <section className="band">
        <div className="section" style={{ textAlign: "center", maxWidth: 900 }}>
          <Reveal>
            <span className="sec-eyebrow" data-num="—" style={{ justifyContent: "center" }}>El Perri</span>
            <h2 className="h2" style={{ fontSize: "clamp(28px, 5vw, 48px)" }}>
              “{SITE.tagline}”
            </h2>
          </Reveal>
        </div>
      </section>

      {/* GALLERY */}
      <section className="section">
        <Reveal>
          <div className="sec-head">
            <span className="sec-eyebrow" data-num="03">De nuestra cocina</span>
            <h2 className="h2">Galería</h2>
          </div>
        </Reveal>
        <div className="gallery">
          {GALLERY.map((photo, i) => (
            <Reveal key={photo.src} delay={i * 80}>
              <figure className="gallery-item">
                <Image src={photo.src} alt={photo.label} fill sizes="(min-width: 720px) 25vw, 50vw" />
                <figcaption>{photo.label}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* VIDEO */}
      {VIDEO && (
        <section className="section" style={{ paddingTop: 0 }}>
          <Reveal>
            <div className="sec-head">
              <span className="sec-eyebrow" data-num="04">Nuestra historia</span>
              <h2 className="h2">Un sueño que sigue creciendo</h2>
            </div>
            <div className="video-wrap">
              {/* preload="none" + no autoplay: keeps the ~9MB clip off the
                  critical path — it only downloads when the visitor hits play */}
              <video
                className="video"
                src={VIDEO.src}
                poster={VIDEO.poster}
                aria-label="Video de El Perri Latin Food"
                preload="none"
                muted
                loop
                playsInline
                controls
              />
            </div>
            {VIDEO.caption && <p className="lead" style={{ marginTop: 18 }}>{VIDEO.caption}</p>}
          </Reveal>
        </section>
      )}

      {/* INSTAGRAM REELS */}
      {SITE.social?.instagram && (
        <section className="section" style={{ paddingTop: 0 }}>
          <Reveal>
            <div className="sec-head">
              <span className="sec-eyebrow" data-num="05">En Instagram</span>
              <h2 className="h2">Míranos en reels</h2>
            </div>
            <p className="lead" style={{ marginBottom: 30 }}>
              Cada semana subimos lo que sale de la cocina y del truck. Síguenos en {" "}
              <a href={SITE.social.instagram} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary-text)", fontWeight: 700 }}>@elperri.food</a>.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <InstagramReels reels={REELS} profile={SITE.social.instagram} />
          </Reveal>
          <Reveal delay={140}>
            <div className="section-actions">
              <a className="btn btn-gold" href={SITE.social.instagram} target="_blank" rel="noopener noreferrer">
                <IgIcon /> Síguenos en Instagram
              </a>
            </div>
          </Reveal>
        </section>
      )}

    </main>
    </>
  );
}
