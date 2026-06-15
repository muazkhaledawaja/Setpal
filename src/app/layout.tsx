import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://setpal.vercel.app"),
  title: "Setpal — Coaching Platform",
  description:
    "Clean numbers without doing math. One calm screen for every coach, in Arabic and English.",
  icons: {
    icon: "/brand/setpal-favicon.svg",
    shortcut: "/brand/setpal-favicon.svg",
  },
};

// The <html>/<body> elements are rendered by the [locale] layout, which has
// access to the resolved locale for correct lang/dir. This root layout is a
// pass-through so locale-aware markup lives where the locale is known.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
