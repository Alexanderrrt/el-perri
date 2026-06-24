import { SITE } from "../site.config";

const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2.2Z" />
  </svg>
);
const IconGlobe = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
  </svg>
);
const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export function Footer() {
  const year = new Date().getFullYear();
  const stripEmoji = (s) => s.replace(/^[^\w(]+\s*/, "");
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <p className="footer-brand">
            {SITE.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={SITE.logo} alt="" aria-hidden="true" />
            )}
            {SITE.name}
          </p>
          {SITE.address.map((line, i) => (
            <p key={i}>{stripEmoji(line)}</p>
          ))}
          <p className="footer-contact" style={{ marginTop: 12 }}>
            <IconPhone />
            <a href={SITE.phoneHref} className="footer-link">{SITE.phone}</a>
          </p>
          {SITE.website && (
            <p className="footer-contact">
              <IconGlobe />
              <a href={SITE.website} className="footer-link" target="_blank" rel="noopener noreferrer">
                {SITE.email || "elperrilatinfood.com"}
              </a>
            </p>
          )}
          {SITE.social?.instagram && (
            <p className="footer-contact">
              <IconInstagram />
              <a href={SITE.social.instagram} className="footer-link" target="_blank" rel="noopener noreferrer">
                @elperri.food
              </a>
            </p>
          )}
        </div>
        <div>
          <p className="footer-h">Horario</p>
          {SITE.hours.map(([day, time]) => (
            <p key={day}>
              <span className="footer-day">{day}</span> {time}
            </p>
          ))}
        </div>
        <div>
          <p className="footer-h">Explorar</p>
          <p><a href="/menu" className="footer-link">Menú</a></p>
          <p><a href="/nuestra-historia" className="footer-link">Nuestra historia</a></p>
          <p><a href="/catering" className="footer-link">Catering</a></p>
        </div>
      </div>
      <p className="footer-fine">
        © {year} {SITE.name} · {SITE.city} · La felicidad hecha comida.
      </p>
    </footer>
  );
}
