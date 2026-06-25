import { getTranslations } from "next-intl/server";
import { Dumbbell } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";
import { FEATURE_ICONS } from "./icons";

interface FeatureItem {
  icon: string;
  title: string;
  body: string;
}

function FormMock() {
  return (
    <div className="lp-form-mock">
      <div className="lp-fm-header">
        <span className="lp-fm-dot-r" />
        <span className="lp-fm-dot-r" />
        <span className="lp-fm-dot-r" />
        <span className="lp-fm-title">Weekly check-in</span>
      </div>
      <div className="lp-fm-body">
        <div className="lp-fm-field">
          <span className="lp-fm-label">Weight today</span>
          <div className="lp-fm-input-row">
            <div className="lp-fm-val">72.4</div>
            <span className="lp-fm-unit">kg</span>
          </div>
        </div>
        <div className="lp-fm-field">
          <span className="lp-fm-label">Energy level</span>
          <div className="lp-fm-bars">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className={`lp-fm-bar${i < 7 ? " on" : ""}`} />
            ))}
            <span className="lp-fm-bar-val">7/10</span>
          </div>
        </div>
        <div className="lp-fm-field">
          <span className="lp-fm-label">Hit steps target?</span>
          <div className="lp-fm-pills">
            <span className="lp-fm-pill on">Yes ✓</span>
            <span className="lp-fm-pill">No</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function LandingFeatures() {
  const t = await getTranslations("landing.features");
  const items = t.raw("items") as FeatureItem[];

  const [anchor, ...rest] = items;
  const AnchorIcon = FEATURE_ICONS[anchor.icon] ?? Dumbbell;

  return (
    <section className="lp-section" id="features">
      <ScrollReveal>
        <div className="lp-section-head">
          <h2>{t("title")}</h2>
          <p>{t("sub")}</p>
        </div>
      </ScrollReveal>

      <div className="lp-feat-grid">
        {/* Anchor card — left, tall */}
        <ScrollReveal variant="scale" className="lp-feat-anchor-wrap">
          <div className="lp-feat-card lp-feat-anchor">
            <div className="lp-feat-ic">
              <AnchorIcon size={22} strokeWidth={2} />
            </div>
            <h3>{anchor.title}</h3>
            <p>{anchor.body}</p>
            <FormMock />
          </div>
        </ScrollReveal>

        {/* 3 smaller cards — right column stack */}
        <div className="lp-feat-stack">
          {rest.map((item, i) => {
            const Icon = FEATURE_ICONS[item.icon] ?? Dumbbell;
            return (
              <ScrollReveal key={item.title} delay={(i + 1) * 80} variant="scale">
                <div className="lp-feat-card">
                  <div className="lp-feat-ic">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
