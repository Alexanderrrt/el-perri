"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE, localizedPath } from "../content";

/** Footer — Location, verified operating hours, contact, and legal links. */
export function Footer() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const es = locale === "es";
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Image src="/media/logo.webp" width={84} height={84} alt="El Gran Tamal Colombiano" />
          <p>{es ? "Sabor colombiano, de nuestra tierra para tu mesa." : "Colombian flavor, from our homeland to your table."}</p>
        </div>
        <div>
          <h2>{es ? "Visítanos" : "Visit us"}</h2>
          <p>{SITE.address}</p>
          <p><a href={SITE.maps} target="_blank" rel="noreferrer">{es ? "Cómo llegar" : "Get directions"}</a></p>
        </div>
        <div>
          <h2>{es ? "Horario" : "Hours"}</h2>
          <p>{es ? "Mar–Vie 9 a.m.–9 p.m." : "Tue–Fri 9 a.m.–9 p.m."}<br />
            {es ? "Sáb 8 a.m.–9 p.m. · Dom 8 a.m.–4 p.m." : "Sat 8 a.m.–9 p.m. · Sun 8 a.m.–4 p.m."}<br />
            {es ? "Lunes cerrado" : "Closed Monday"}</p>
        </div>
        <div>
          <h2>{es ? "Hablemos" : "Contact"}</h2>
          <p><a href={SITE.phoneHref}>{SITE.phone}</a></p>
          <p><a href={SITE.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a> · <a href={SITE.instagram} target="_blank" rel="noreferrer">Instagram</a></p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {SITE.name}</span>
        <span><Link href={localizedPath(locale, "privacy")}>{es ? "Privacidad" : "Privacy"}</Link> · <Link href={localizedPath(locale, "terms")}>{es ? "Términos" : "Terms"}</Link></span>
      </div>
    </footer>
  );
}
