"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { localizedPath } from "../content";

const pageFromPath = (pathname) => {
  if (pathname.includes("/menu")) return "menu";
  if (pathname.includes("/mayoreo") || pathname.includes("/wholesale")) return "wholesale";
  if (pathname.includes("/historia") || pathname.includes("/about")) return "about";
  if (pathname.includes("/privacy")) return "privacy";
  if (pathname.includes("/terms")) return "terms";
  return "home";
};

/** Header — Bilingual primary navigation and persistent locale switcher. */
export function Header() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const otherLocale = locale === "es" ? "en" : "es";
  const currentPage = pageFromPath(pathname);
  const labels = locale === "es"
    ? { home: "Inicio", menu: "Menú", wholesale: "Mayoreo", about: "Historia", call: "Llamar", language: "English" }
    : { home: "Home", menu: "Menu", wholesale: "Wholesale", about: "About", call: "Call", language: "Español" };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <header className="site-header">
      <Link href={localizedPath(locale, "home")} className="brand" aria-label="El Gran Tamal Colombiano">
        <Image src="/media/logo.webp" width={62} height={62} alt="" priority />
        <span>El Gran Tamal <strong>Colombiano</strong></span>
      </Link>
      <nav className="primary-nav" aria-label={locale === "es" ? "Navegación principal" : "Primary navigation"}>
        {(["home", "menu", "wholesale", "about"]).map((page) => (
          <Link key={page} href={localizedPath(locale, page)} aria-current={currentPage === page ? "page" : undefined}>
            {labels[page]}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <Link className="language-link" href={localizedPath(otherLocale, currentPage)} hrefLang={otherLocale}>
          {labels.language}
        </Link>
        <a className="button button--small" href="tel:+15599436954">{labels.call}</a>
      </div>
    </header>
  );
}
