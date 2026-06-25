import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { LandingNav } from "@/components/landing/nav";
import { BuilderHero } from "@/components/landing/builder-hero";
import { LandingFeatures } from "@/components/landing/features";
import { LandingHow } from "@/components/landing/how";
import { LandingMena } from "@/components/landing/mena";
import { LandingPricing } from "@/components/landing/pricing";
import { LandingFaq } from "@/components/landing/faq";
import { LandingFooter } from "@/components/landing/footer";
import "@/components/landing/landing.css";

const SITE_URL = "https://setpal.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing.meta" });
  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ar: "/ar",
        en: "/en",
        "x-default": `/${routing.defaultLocale}`,
      },
    },
    openGraph: {
      type: "website",
      siteName: "Setpal",
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      locale: locale === "ar" ? "ar_EG" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

interface QA {
  q: string;
  a: string;
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tMeta = await getTranslations("landing.meta");
  const tFaq = await getTranslations("landing.faq");
  const faqItems = tFaq.raw("items") as QA[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Setpal",
        url: SITE_URL,
        logo: `${SITE_URL}/landing/setpal-logo.svg`,
        description: tMeta("description"),
      },
      {
        "@type": "SoftwareApplication",
        name: "Setpal",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: tMeta("description"),
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "14-day free trial",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <div className="lp-root">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingNav />
      <main>
        <BuilderHero />
        <LandingHow />
        <LandingFeatures />
        <LandingMena />
        <LandingPricing />
        <LandingFaq />
      </main>
      <LandingFooter />
    </div>
  );
}
