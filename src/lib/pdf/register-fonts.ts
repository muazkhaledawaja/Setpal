import path from "node:path";
import { Font } from "@react-pdf/renderer";

let registered = false;

// Registers an Arabic-capable font for PDF rendering. Latin glyphs are covered too.
export function registerPdfFonts() {
  if (registered) return;
  const dir = path.join(process.cwd(), "public", "fonts");
  Font.register({
    family: "IBMPlexArabic",
    fonts: [
      { src: path.join(dir, "IBMPlexSansArabic-Regular.ttf") },
      { src: path.join(dir, "IBMPlexSansArabic-Bold.ttf"), fontWeight: "bold" },
    ],
  });
  // react-pdf hyphenates by default which breaks Arabic; disable it.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}
