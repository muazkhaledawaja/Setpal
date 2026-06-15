import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const TEAL = "#1f6b6e";
const CREAM = "#faf8f2";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });
  const isAr = locale === "ar";

  const title = t("hero.title").replace("\n", " ");
  const description = t("meta.description");

  // The built-in next/og font cannot shape Arabic glyphs. IBM Plex Sans Arabic
  // covers both Arabic and Latin, so use it for every locale.
  const fontData = await readFile(
    join(process.cwd(), "src/app/fonts/arabic-bold.ttf"),
  );
  const fonts = [
    {
      name: "Brand" as const,
      data: fontData,
      weight: 700 as const,
      style: "normal" as const,
    },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: CREAM,
          fontFamily: "Brand",
          direction: isAr ? "rtl" : "ltr",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: TEAL,
            fontSize: 40,
            fontWeight: 700,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: TEAL,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: CREAM,
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            S
          </div>
          Setpal
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#1a2b2b",
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 30,
            color: "#5a6a6a",
            marginTop: 28,
            maxWidth: 900,
          }}
        >
          {description}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
