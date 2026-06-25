"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Minus } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

interface QA {
  q: string;
  a: string;
}

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);

  return (
    <div className={"lp-card lp-faq-item" + (open ? " is-open" : "")}>
      <button
        type="button"
        className="lp-faq-q"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{q}</span>
        {open ? (
          <Minus className="lp-faq-icon" size={18} strokeWidth={2} />
        ) : (
          <Plus className="lp-faq-icon" size={18} strokeWidth={2} />
        )}
      </button>
      <div className="lp-faq-body">
        <p className="lp-faq-a">{a}</p>
      </div>
    </div>
  );
}

export function LandingFaq() {
  const t = useTranslations("landing.faq");
  const items = t.raw("items") as QA[];

  return (
    <section className="lp-section lp-faq" id="faq">
      <ScrollReveal>
        <div className="lp-section-head">
          <h2>{t("title")}</h2>
        </div>
      </ScrollReveal>
      <div className="lp-faq-list">
        {items.map((item, i) => (
          <ScrollReveal key={item.q} delay={i * 40}>
            <FaqItem q={item.q} a={item.a} defaultOpen={i === 0} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
