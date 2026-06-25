import { getTranslations } from "next-intl/server";
import { ScrollReveal } from "./scroll-reveal";

interface Step {
  n: string;
  title: string;
  body: string;
}

export async function LandingHow() {
  const t = await getTranslations("landing.how");
  const steps = t.raw("steps") as Step[];

  return (
    <section className="lp-how" id="how">
      <div style={{ maxWidth: "1160px", marginInline: "auto", paddingInline: "32px" }}>
        <ScrollReveal>
          <div className="lp-section-head">
            <h2>{t("title")}</h2>
          </div>
        </ScrollReveal>

        <div className="lp-how-grid">
          {steps.map((s, i) => (
            <ScrollReveal key={s.n} delay={i * 120} variant="left">
              <div className="lp-step">
                <div className="lp-step-n">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
