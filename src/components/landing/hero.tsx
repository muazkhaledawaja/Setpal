import { getTranslations } from "next-intl/server";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { AppMock } from "./app-mock";

export async function LandingHero() {
  const t = await getTranslations("landing.hero");

  return (
    <section className="lp-hero">
      <div className="lp-hero-copy">
        <span className="lp-eyebrow">{t("eyebrow")}</span>
        <h1 className="lp-hero-title">{t("title")}</h1>
        <p className="lp-hero-sub">{t("sub")}</p>
        <div className="lp-hero-cta">
          <Link href="/register" className="lp-btn lp-btn-primary lp-btn-lg">
            {t("ctaPrimary")}
          </Link>
          <a href="#how" className="lp-btn lp-btn-ghost lp-btn-lg">
            {t("ctaSecondary")}
            <ArrowRight size={16} strokeWidth={2} className="rtl:rotate-180" />
          </a>
        </div>
        <div className="lp-hero-note">
          <CheckCircle2 size={15} strokeWidth={2} /> {t("note")}
        </div>
      </div>
      <div className="lp-hero-visual">
        <AppMock />
      </div>
    </section>
  );
}
