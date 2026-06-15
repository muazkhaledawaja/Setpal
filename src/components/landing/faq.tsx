import { getTranslations } from "next-intl/server";
import { Plus, Minus } from "lucide-react";

interface QA {
  q: string;
  a: string;
}

export async function LandingFaq() {
  const t = await getTranslations("landing.faq");
  const items = t.raw("items") as QA[];

  return (
    <section className="lp-section lp-faq" id="faq">
      <div className="lp-section-head">
        <h2>{t("title")}</h2>
      </div>
      <div className="lp-faq-list">
        {items.map((item, i) => (
          <details key={item.q} className="lp-card lp-faq-item" open={i === 0}>
            <summary className="lp-faq-q">
              <span>{item.q}</span>
              <Plus className="lp-faq-plus" size={18} strokeWidth={2} />
              <Minus className="lp-faq-minus" size={18} strokeWidth={2} />
            </summary>
            <p className="lp-faq-a">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
