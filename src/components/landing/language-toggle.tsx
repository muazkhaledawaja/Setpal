"use client";

import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/routing";

export function LanguageToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("landing.nav");

  const next = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: next })}
      className="lp-lang"
      aria-label={t("switchLanguage")}
    >
      <Languages className="size-4" strokeWidth={2} />
      <span>{next === "ar" ? "العربية" : "English"}</span>
    </button>
  );
}
