import { getTranslations } from "next-intl/server";
import { Check, ArrowLeftRight } from "lucide-react";

export async function LandingMena() {
  const t = await getTranslations("landing.mena");
  const points = t.raw("points") as string[];

  return (
    <section className="lp-section">
      <div className="lp-mena lp-card">
        <div className="lp-mena-copy">
          <span className="lp-eyebrow">{t("eyebrow")}</span>
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
        <div className="lp-mena-glyph">
          <div className="lp-glyph-ar">ع</div>
          <div className="lp-glyph-swap">
            <ArrowLeftRight size={20} strokeWidth={2} />
          </div>
          <div className="lp-glyph-en">En</div>
        </div>
      </div>
    </section>
  );
}
