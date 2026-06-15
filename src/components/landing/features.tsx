import { getTranslations } from "next-intl/server";
import { Dumbbell } from "lucide-react";
import { FEATURE_ICONS } from "./icons";

interface FeatureItem {
  icon: string;
  title: string;
  body: string;
}

export async function LandingFeatures() {
  const t = await getTranslations("landing.features");
  const items = t.raw("items") as FeatureItem[];

  return (
    <section className="lp-section" id="features">
      <div className="lp-section-head">
        <h2>{t("title")}</h2>
        <p>{t("sub")}</p>
      </div>
      <div className="lp-feat-grid">
        {items.map((item) => {
          const Icon = FEATURE_ICONS[item.icon] ?? Dumbbell;
          return (
            <div key={item.title} className="lp-card lp-feat">
              <div className="lp-feat-ic">
                <Icon size={22} strokeWidth={2} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
