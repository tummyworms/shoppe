import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { config } from "@/lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const siteUrl = process.env.URL ?? "https://thedesignershoppe.store";
const description = `${config.shopName}: ${config.tagline}. Browse our collection and message us on Facebook for pricing, shipping, or to arrange a visit.`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${config.shopName} — By Nancy LoAlbo`,
  description,
  openGraph: {
    title: config.shopName,
    siteName: config.shopName,
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
