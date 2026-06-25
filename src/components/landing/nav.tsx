// src/components/landing/nav.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LanguageToggle } from "./language-toggle";
import { ApplyModal } from "./apply-modal";

export function LandingNav() {
  const t = useTranslations("landing.nav");
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" aria-label="Setpal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landing/setpal-logo.svg" alt="Setpal" className="lp-logo-img" />
          </Link>
          <nav className="lp-nav-links">
            <a href="#features">{t("features")}</a>
            <a href="#how">{t("how")}</a>
            <a href="#pricing">{t("pricing")}</a>
            <a href="#faq">{t("faq")}</a>
          </nav>
          <div className="lp-nav-right">
            <LanguageToggle />
            <Link href="/login" className="lp-link-signin">
              {t("signin")}
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="lp-btn lp-btn-primary lp-btn-sm"
            >
              {t("cta")}
            </button>
          </div>
        </div>
      </header>
      <ApplyModal open={open} onOpenChange={setOpen} />
    </>
  );
}
