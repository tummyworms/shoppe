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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.URL ?? "http://localhost:3000"),
  title: {
    default: `${config.shopName} — ${config.tagline}`,
    template: `%s · ${config.shopName}`,
  },
  description: `${config.shopName}: ${config.tagline}. Browse our collection and message us on Facebook for pricing, shipping, or to arrange a visit.`,
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
