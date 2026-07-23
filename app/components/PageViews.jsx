import Image from "next/image";
import Link from "next/link";
import { ContactActions } from "./ContactActions";
import { MenuSections } from "./MenuSections";
import { HOURS, SITE, localizedPath } from "../content";

const copy = {
  es: {
    kicker: "Auténtico sabor colombiano",
    hero: "El sabor de nuestra tierra, servido con orgullo.",
    heroText: "Tamales tolimenses, desayunos, antojitos y platos colombianos preparados con ese sabor casero que siempre invita a volver.",
    restaurant: "Restaurante en San José",
    restaurantText: "Ven por un tamal recién servido, un desayuno completo o uno de nuestros antojitos colombianos. Tenemos mesas, pedidos para llevar y atención con cariño.",
    wholesale: "Tamales al por mayor",
    wholesaleText: "Llevamos tamales tolimenses artesanales a restaurantes, tiendas, cafeterías, empresas y eventos en Fontana y Los Ángeles.",
    specialties: "Favoritos de la casa",
    visit: "Tu próxima parada colombiana",
    visitText: "Estamos en el corazón de San José. Revisa el horario, llámanos para confirmar disponibilidad y ven con hambre.",
  },
  en: {
    kicker: "Authentic Colombian flavor",
    hero: "The flavor of our homeland, served with pride.",
    heroText: "Tolimense tamales, breakfast, street-food favorites, and Colombian plates made with the comforting flavors that keep you coming back.",
    restaurant: "San Jose restaurant",
    restaurantText: "Stop by for a freshly served tamal, a full breakfast, or one of our Colombian favorites. Dine in, order takeout, and feel right at home.",
    wholesale: "Wholesale tamales",
    wholesaleText: "We supply handmade Tolimense tamales to restaurants, stores, cafés, businesses, and events across Fontana and Los Angeles.",
    specialties: "House favorites",
    visit: "Your next Colombian stop",
    visitText: "Find us in the heart of San Jose. Check our hours, call to confirm availability, and come hungry.",
  },
};

export function HomeView({ locale = "es" }) {
  const t = copy[locale];
  return (
    <main>
      <section className="hero">
        <Image src="/media/hero-truck.webp" alt={locale === "es" ? "Camión de El Gran Tamal Colombiano" : "El Gran Tamal Colombiano food truck"} fill priority sizes="100vw" />
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow">{t.kicker}</p>
          <h1>{t.hero}</h1>
          <p>{t.heroText}</p>
          <div className="button-row"><Link className="button" href={localizedPath(locale, "menu")}>{locale === "es" ? "Ver el menú" : "View menu"}</Link><a className="button button--light" href={SITE.maps} target="_blank" rel="noreferrer">{locale === "es" ? "Cómo llegar" : "Directions"}</a></div>
        </div>
      </section>

      <section className="section operation-grid">
        <article className="operation-card operation-card--dark">
          <span>01</span><h2>{t.restaurant}</h2><p>{t.restaurantText}</p>
          <Link href={localizedPath(locale, "menu")}>{locale === "es" ? "Explorar el menú →" : "Explore the menu →"}</Link>
        </article>
        <article className="operation-card operation-card--gold">
          <span>02</span><h2>{t.wholesale}</h2><p>{t.wholesaleText}</p>
          <Link href={localizedPath(locale, "wholesale")}>{locale === "es" ? "Conocer mayoreo →" : "Explore wholesale →"}</Link>
        </article>
      </section>

      <section className="section">
        <div className="section-heading"><p className="eyebrow">{locale === "es" ? "Con todo el sabor" : "Full of flavor"}</p><h2>{t.specialties}</h2></div>
        <div className="food-grid">
          {[
            ["/media/truck.webp", "Tamal Colombiano", locale === "es" ? "El clásico de la casa, envuelto y preparado al estilo tolimense." : "Our house classic, wrapped and prepared Tolimense style."],
            ["/media/salchipapa.webp", "Salchimonster", locale === "es" ? "Papas, carnes, salchicha, queso, maíz y la salsa de la casa." : "Fries, meats, sausage, cheese, corn, and house sauce."],
            ["/media/empanadas.webp", "Empanadas", locale === "es" ? "Doraditas, crocantes y recién hechas." : "Golden, crispy, and made fresh."],
          ].map(([src, title, text]) => <article className="food-card" key={src}><Image src={src} alt={title} width={1020} height={765} sizes="(max-width: 760px) 100vw, 33vw" /><div><h3>{title}</h3><p>{text}</p></div></article>)}
        </div>
      </section>

      <section className="section visit-grid">
        <div><p className="eyebrow">San Jose, California</p><h2>{t.visit}</h2><p>{t.visitText}</p><address>{SITE.address}</address><a className="text-link" href={SITE.maps} target="_blank" rel="noreferrer">{locale === "es" ? "Abrir en Google Maps →" : "Open in Google Maps →"}</a></div>
        <div className="hours-card"><h3>{locale === "es" ? "Horario" : "Hours"}</h3>{HOURS.map((day) => <div key={day.en}><span>{day[locale]}</span><strong>{locale === "es" ? day.valueEs : day.valueEn}</strong></div>)}</div>
      </section>

      <section className="section gallery-section">
        <div className="section-heading"><p className="eyebrow">@elgrantamalcolombiano</p><h2>{locale === "es" ? "Así se vive el sabor" : "See the flavor"}</h2></div>
        <div className="gallery-grid">
          {["san-jose-1", "san-jose-2", "san-jose-visit-1", "san-jose-visit-2", "san-jose-visit-3"].map((name, index) => <Image key={name} className={`gallery-${index + 1}`} src={`/media/${name}.webp`} alt={locale === "es" ? "Comida y ambiente de El Gran Tamal Colombiano" : "Food and atmosphere at El Gran Tamal Colombiano"} width={1024} height={1365} sizes="(max-width: 760px) 50vw, 25vw" />)}
        </div>
      </section>
    </main>
  );
}

export function MenuView({ locale = "es" }) {
  return <main><PageHero locale={locale} eyebrow={locale === "es" ? "31 platos · 15 bebidas · 20 adicionales" : "31 dishes · 15 drinks · 20 add-ons"} title={locale === "es" ? "Menú colombiano, hecho para disfrutar." : "Colombian food, made to enjoy."} text={locale === "es" ? "Precios y disponibilidad pueden cambiar. Llama o escribe por WhatsApp antes de ordenar." : "Prices and availability may change. Call or message us on WhatsApp before ordering."} image="/media/san-jose-1.webp" /><div className="section menu-wrap"><MenuSections locale={locale} /></div></main>;
}

export function WholesaleView({ locale = "es" }) {
  const es = locale === "es";
  const features = es
    ? [["Sabor auténtico", "Receta tolimense y preparación artesanal."], ["Listos para vender", "Una opción de alta rotación para restaurantes, tiendas y cafeterías."], ["Volumen flexible", "Pedidos para negocios, empresas, reuniones y eventos."], ["Servicio regional", "Atendemos Fontana, Los Ángeles y zonas cercanas."]]
    : [["Authentic flavor", "Tolimense recipe and handmade preparation."], ["Ready to sell", "A high-demand option for restaurants, stores, and cafés."], ["Flexible volume", "Orders for businesses, companies, gatherings, and events."], ["Regional service", "Serving Fontana, Los Angeles, and nearby areas."]];
  return <main><PageHero locale={locale} eyebrow={es ? "Tamales tolimenses al por mayor" : "Wholesale Tolimense tamales"} title={es ? "Un producto colombiano que tus clientes van a recordar." : "A Colombian favorite your customers will remember."} text={es ? "Tamales artesanales para negocios, eventos y equipos que quieren servir sabor auténtico." : "Handmade tamales for businesses, events, and teams looking to serve authentic flavor."} image="/media/wholesale-2.webp" />
    <section className="section feature-grid">{features.map(([title, text], i) => <article key={title}><span>0{i + 1}</span><h2>{title}</h2><p>{text}</p></article>)}</section>
    <section className="section wholesale-gallery"><Image src="/media/wholesale-1.webp" width={640} height={1136} alt={es ? "Tamales colombianos preparados para venta al por mayor" : "Colombian tamales prepared for wholesale"} /><div className="wholesale-copy"><p className="eyebrow">{SITE.wholesaleArea}</p><h2>{es ? "Hablemos de tu próximo pedido" : "Let’s talk about your next order"}</h2><p>{es ? "Cuéntanos cuántos tamales necesitas, la fecha y tu zona. Confirmaremos disponibilidad, precio por volumen y entrega directamente contigo." : "Tell us how many tamales you need, your date, and your area. We’ll confirm availability, volume pricing, and delivery directly with you."}</p><ContactActions locale={locale} wholesale /></div><Image src="/media/wholesale-3.webp" width={640} height={1136} alt={es ? "Distribución de tamales colombianos en el sur de California" : "Colombian tamale distribution in Southern California"} /></section>
  </main>;
}

export function AboutView({ locale = "es" }) {
  const es = locale === "es";
  return <main><PageHero locale={locale} eyebrow={es ? "Nuestra historia" : "Our story"} title={es ? "Una receta tolimense que sigue encontrando nuevos hogares." : "A Tolimense recipe that keeps finding new homes."} text={es ? "El Gran Tamal Colombiano nació del deseo de compartir los sabores que nos conectan con Colombia." : "El Gran Tamal Colombiano grew from a desire to share the flavors that connect us to Colombia."} image="/media/san-jose-2.webp" />
    <section className="section story-grid"><div><p className="eyebrow">{es ? "De nuestra tierra" : "From our homeland"}</p><h2>{es ? "Tradición que se sirve caliente" : "Tradition served warm"}</h2></div><div><p>{es ? "Nuestro tamal tolimense reúne arroz, arveja, carnes, huevo, papa, zanahoria y guiso en una preparación generosa, envuelta con paciencia y hecha para compartir." : "Our Tolimense tamal brings together rice, peas, meats, egg, potato, carrot, and Colombian stew in a generous preparation, patiently wrapped and made to share."}</p><p>{es ? "En San José servimos una carta amplia de desayunos, antojitos y platos colombianos. Desde Fontana también llevamos nuestros tamales a negocios y eventos en Los Ángeles y sus alrededores." : "In San Jose we serve a broad menu of breakfasts, street-food favorites, and Colombian plates. From Fontana, we also supply tamales to businesses and events across Los Angeles and nearby areas."}</p></div></section>
    <section className="section image-band"><Image src="/media/san-jose-visit-2.webp" width={1012} height={1800} alt={es ? "Visita a El Gran Tamal Colombiano" : "A visit to El Gran Tamal Colombiano"} /><blockquote>{es ? "Lo mejor de nuestra tierra, preparado para reunirnos alrededor de la mesa." : "The best of our homeland, prepared to bring us together around the table."}</blockquote></section>
  </main>;
}

export function PrivacyView({ locale = "es" }) {
  const es = locale === "es";
  return <LegalPage eyebrow={es ? "Legal" : "Legal"} title={es ? "Política de privacidad" : "Privacy policy"} updated={es ? "Actualizada el 22 de julio de 2026" : "Updated July 22, 2026"}>
    <h2>{es ? "Información que recopilamos" : "Information we collect"}</h2><p>{es ? "Este sitio es informativo. No ofrece cuentas, formularios, pagos ni pedidos en línea, y no solicita ni almacena información personal directamente." : "This is an informational website. It does not offer accounts, forms, payments, or online ordering, and it does not directly request or store personal information."}</p>
    <h2>{es ? "Analítica" : "Analytics"}</h2><p>{es ? "Usamos Vercel Analytics y Speed Insights para comprender, de forma agregada, el rendimiento y uso del sitio. No usamos publicidad dirigida ni vendemos información personal." : "We use Vercel Analytics and Speed Insights to understand site performance and usage in aggregate. We do not use targeted advertising or sell personal information."}</p>
    <h2>{es ? "Enlaces externos" : "External links"}</h2><p>{es ? "Al abrir WhatsApp, Instagram, Google Maps o una llamada telefónica, interactúas directamente con ese proveedor y aplican sus propias políticas de privacidad." : "When you open WhatsApp, Instagram, Google Maps, or a phone call, you interact directly with that provider and its own privacy policy applies."}</p>
    <h2>{es ? "Contacto" : "Contact"}</h2><p>{es ? "Para preguntas sobre privacidad, llámanos al" : "For privacy questions, call us at"} <a href={SITE.phoneHref}>{SITE.phone}</a>.</p>
  </LegalPage>;
}

export function TermsView({ locale = "es" }) {
  const es = locale === "es";
  return <LegalPage eyebrow={es ? "Legal" : "Legal"} title={es ? "Términos de uso" : "Terms of use"} updated={es ? "Actualizados el 22 de julio de 2026" : "Updated July 22, 2026"}>
    <h2>{es ? "Uso del sitio" : "Using this site"}</h2><p>{es ? "Este sitio presenta información sobre El Gran Tamal Colombiano, su menú, ubicación y servicio al por mayor. No constituye una plataforma de pedidos ni un contrato de venta." : "This site provides information about El Gran Tamal Colombiano, its menu, location, and wholesale service. It is not an ordering platform or a sales contract."}</p>
    <h2>{es ? "Precios y disponibilidad" : "Prices and availability"}</h2><p>{es ? "Los precios, ingredientes, horarios y disponibilidad pueden cambiar. Confirma la información por teléfono o WhatsApp antes de visitar u ordenar." : "Prices, ingredients, hours, and availability may change. Confirm details by phone or WhatsApp before visiting or ordering."}</p>
    <h2>{es ? "Alergias" : "Allergies"}</h2><p>{es ? "Nuestros alimentos pueden contener alérgenos. Comunícate con el restaurante antes de ordenar si tienes alergias o restricciones alimentarias." : "Our food may contain allergens. Contact the restaurant before ordering if you have allergies or dietary restrictions."}</p>
    <h2>{es ? "Contenido" : "Content"}</h2><p>{es ? "La marca, fotografías y textos pertenecen a sus respectivos propietarios y no pueden reutilizarse sin autorización." : "Branding, photographs, and text belong to their respective owners and may not be reused without permission."}</p>
  </LegalPage>;
}

function PageHero({ locale, eyebrow, title, text, image }) {
  return <header className="page-hero"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{text}</p></div><Image src={image} alt="" width={1024} height={1365} priority sizes="(max-width: 760px) 100vw, 45vw" /></header>;
}

function LegalPage({ eyebrow, title, updated, children }) {
  return <main><header className="legal-head"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{updated}</p></header><article className="legal-content">{children}</article></main>;
}
