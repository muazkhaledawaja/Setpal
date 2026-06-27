"use client";

import { useTranslations } from "next-intl";
import { Users } from "lucide-react";
import { Link } from "@/i18n/routing";
import { ScrollReveal } from "./scroll-reveal";

interface Tier {
  name: string;
  price: string;
  desc: string;
  limit: string;
  popular?: boolean;
}

export function LandingPricing() {
  const t = useTranslations("landing.pricing");
  const tiers = t.raw("tiers") as Tier[];

  return (
    <>
      <section className="lp-section" id="pricing">
        <ScrollReveal>
          <div className="lp-section-head">
            <h2>{t("title")}</h2>
            <p>{t("sub")}</p>
          </div>
        </ScrollReveal>
        <div className="lp-price-grid">
          {tiers.map((tier, i) => {
            const hasNumber = /[0-9٠-٩]/.test(tier.price);
            return (
              <ScrollReveal key={tier.name} delay={i * 60} variant="up">
                <div className={"lp-card lp-price" + (tier.popular ? " is-pop" : "")}>
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
              </ScrollReveal>
            );
          })}
        </div>
      </section>
    </>
  );
}
