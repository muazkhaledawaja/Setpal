"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Menu, X } from "lucide-react";
import { LanguageToggle } from "./language-toggle";

export function LandingNav() {
  const t = useTranslations("landing.nav");
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "#features", label: t("features") },
    { href: "#how", label: t("how") },
    { href: "#pricing", label: t("pricing") },
    { href: "#faq", label: t("faq") },
  ];

  return (
    <>
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" aria-label="Setpal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landing/setpal-logo.svg" alt="Setpal" className="lp-logo-img" />
          </Link>

          <nav className="lp-nav-links" aria-label="Main navigation">
            {links.map((l) => (
              <a key={l.href} href={l.href}>{l.label}</a>
            ))}
          </nav>

          <div className="lp-nav-right">
            <LanguageToggle />
            <Link href="/login" className="lp-link-signin">
              {t("signin")}
            </Link>
            <Link href="/register" className="lp-btn lp-btn-primary lp-btn-sm">
              {t("cta")}
            </Link>
            <button
              type="button"
              className="lp-hamburger"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div className={"lp-mobile-menu" + (menuOpen ? " is-open" : "")} aria-hidden={!menuOpen}>
          <div className="lp-mobile-inner">
            <nav>
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="lp-mobile-link"
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="lp-mobile-footer">
              <Link href="/login" className="lp-btn lp-btn-outline lp-btn-block" onClick={() => setMenuOpen(false)}>
                {t("signin")}
              </Link>
              <Link
                href="/register"
                className="lp-btn lp-btn-primary lp-btn-block"
                onClick={() => setMenuOpen(false)}
              >
                {t("cta")}
              </Link>
            </div>
          </div>
        </div>
      </header>

    </>
  );
}
