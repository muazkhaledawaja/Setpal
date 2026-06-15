import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export async function LandingFooter() {
  const t = await getTranslations("landing.footer");

  return (
    <footer className="lp-footer">
      <div className="lp-footer-cta lp-card">
        <h2>{t("title")}</h2>
        <p>{t("sub")}</p>
        <Link href="/register" className="lp-btn lp-btn-primary lp-btn-lg">
          {t("cta")}
        </Link>
      </div>
      <div className="lp-footer-bottom">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landing/setpal-logo.svg"
          alt="Setpal"
          className="lp-logo-img"
          style={{ height: 28 }}
        />
        <div className="lp-footer-copy">{t("copyright")}</div>
      </div>
    </footer>
  );
}
