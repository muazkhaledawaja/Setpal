import { getTranslations } from "next-intl/server";
import { Check, ArrowLeftRight } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

export async function LandingMena() {
  const t = await getTranslations("landing.mena");
  const points = t.raw("points") as string[];

  return (
    <section className="lp-section">
      <ScrollReveal>
        <div className="lp-mena lp-card">
          <div className="lp-mena-copy">
            <span className="lp-eyebrow-inv">{t("eyebrow")}</span>
            <h2>{t("title")}</h2>
            <p>{t("body")}</p>
            <ul className="lp-mena-points">
              {points.map((p) => (
                <li key={p}>
                  <Check size={16} strokeWidth={2} /> {p}
                </li>
              ))}
            </ul>
          </div>
          <ScrollReveal variant="scale" delay={100}>
            <div className="lp-mena-glyph">
              <div className="lp-glyph-ar lp-glyph-lg">ع</div>
              <div className="lp-glyph-swap">
                <ArrowLeftRight size={24} strokeWidth={2} />
              </div>
              <div className="lp-glyph-en lp-glyph-lg">En</div>
            </div>
          </ScrollReveal>
        </div>
      </ScrollReveal>
    </section>
  );
}
