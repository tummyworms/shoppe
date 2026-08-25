import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { config } from "@/lib/config";
import SiteHeader from "./_components/SiteHeader";
import SiteFooter from "./_components/SiteFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const siteUrl = process.env.URL ?? "https://thedesignershoppe.store";
const description = `${config.shopName}: ${config.tagline}. Browse our collection and message us on Facebook for pricing, shipping, or to arrange a visit.`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${config.shopName} — ${config.tagline}`,
    template: `%s · ${config.shopName}`,
  },
  description,
  openGraph: {
    title: config.shopName,
    siteName: config.shopName,
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
