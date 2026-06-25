// src/components/landing/footer.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ApplyModal } from "./apply-modal";

export function LandingFooter() {
  const t = useTranslations("landing.footer");
  const [open, setOpen] = useState(false);

  return (
    <>
      <footer className="lp-footer">
        <div className="lp-footer-cta lp-card">
          <h2>{t("title")}</h2>
          <p>{t("sub")}</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="lp-btn lp-btn-primary lp-btn-lg"
          >
            {t("cta")}
          </button>
        </div>
        <div className="lp-footer-bottom">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/setpal-logo.svg"
            alt="Setpal"
            className="lp-logo-img"
            style={{ height: 28 }}
          />
          <div className="lp-footer-copy">{t("copyright")}</div>
        </div>
      </footer>
      <ApplyModal open={open} onOpenChange={setOpen} />
    </>
  );
}
