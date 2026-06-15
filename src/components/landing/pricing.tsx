import { getTranslations } from "next-intl/server";
import { Users } from "lucide-react";
import { Link } from "@/i18n/routing";

interface Tier {
  name: string;
  price: string;
  desc: string;
  limit: string;
  popular?: boolean;
}

export async function LandingPricing() {
  const t = await getTranslations("landing.pricing");
  const tiers = t.raw("tiers") as Tier[];

  return (
    <section className="lp-section" id="pricing">
      <div className="lp-section-head">
        <h2>{t("title")}</h2>
        <p>{t("sub")}</p>
      </div>
      <div className="lp-price-grid">
        {tiers.map((tier) => {
          const hasNumber = /[0-9٠-٩]/.test(tier.price);
          return (
            <div key={tier.name} className={"lp-card lp-price" + (tier.popular ? " is-pop" : "")}>
              {tier.popular && <span className="lp-price-badge">{t("popular")}</span>}
              <div className="lp-price-name">{tier.name}</div>
              <div className="lp-price-amt">
                {tier.price}
                {hasNumber && <span className="lp-price-per">{t("perMonth")}</span>}
              </div>
              <div className="lp-price-desc">{tier.desc}</div>
              <div className="lp-price-limit">
                <Users size={15} strokeWidth={2} /> {tier.limit}
              </div>
              <Link
                href="/register"
                className={"lp-btn lp-btn-block " + (tier.popular ? "lp-btn-primary" : "lp-btn-outline")}
              >
                {t("cta")}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
