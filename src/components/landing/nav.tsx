import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { LanguageToggle } from "./language-toggle";

export async function LandingNav() {
  const t = await getTranslations("landing.nav");

  return (
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
          <Link href="/register" className="lp-btn lp-btn-primary lp-btn-sm">
            {t("cta")}
          </Link>
        </div>
      </div>
    </header>
  );
}
