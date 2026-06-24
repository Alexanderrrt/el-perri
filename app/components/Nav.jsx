"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { SITE } from "../site.config";
import { OrderButton } from "./OrderButton";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/menu", label: "Menú" },
  { href: "/nuestra-historia", label: "Nuestra historia" },
  { href: "/catering", label: "Catering" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <nav className="nav">
      <a href="/" className="brand">
        {SITE.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={SITE.logo} alt={`${SITE.name} logo`} className="brand-logo" />
        )}
        <span>{SITE.shortName}<span className="brand-dot">.</span></span>
      </a>
      <button
        className="nav-toggle"
        aria-label="Menú"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span /><span /><span />
      </button>
      <div className={`nav-links${open ? " open" : ""}`}>
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={active ? "is-active" : undefined}
            >
              {l.label}
            </a>
          );
        })}
        <OrderButton variant="nav" />
      </div>
    </nav>
  );
}
