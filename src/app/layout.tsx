import type { Metadata } from "next";
import { Inter, Fraunces, Cairo } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Setpal — Coaching Platform",
  description: "Clean numbers without doing math. One calm screen for every coach, in Arabic and English.",
  icons: {
    icon: "/brand/setpal-favicon.svg",
    shortcut: "/brand/setpal-favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable} ${cairo.variable}`}
    >
      <body suppressHydrationWarning className="antialiased">
        {children}
      </body>
    </html>
  );
}
