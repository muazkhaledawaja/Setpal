import { getTranslations } from "next-intl/server";

interface Step {
  n: string;
  title: string;
  body: string;
}

export async function LandingHow() {
  const t = await getTranslations("landing.how");
  const steps = t.raw("steps") as Step[];

  return (
    <section className="lp-section lp-how" id="how">
      <div className="lp-section-head">
        <h2>{t("title")}</h2>
      </div>
      <div className="lp-how-grid">
        {steps.map((s, i) => (
          <div key={s.n} className="lp-step">
            <div className="lp-step-n">{s.n}</div>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
            {i < steps.length - 1 && <div className="lp-step-line" />}
          </div>
        ))}
      </div>
    </section>
  );
}
