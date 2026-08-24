"use client";

import Link from "next/link";
import { useState } from "react";
import { config } from "@/lib/config";

export default function SiteHeader() {
  // Show the real logo (public/logo.png). Only fall back to a text wordmark
  // if the image is missing/broken.
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="border-b border-line bg-background/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-center">
        <Link href="/" className="flex flex-col items-center gap-2 group">
          {logoError ? (
            <span className="font-display text-3xl font-extrabold tracking-tight uppercase leading-none">
              {config.shopName}
            </span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/logo.png"
              alt={config.shopName}
              onError={() => setLogoError(true)}
              className="h-24 w-auto object-contain"
            />
          )}
          <span className="text-[11px] uppercase tracking-[0.42em] text-muted pl-[0.42em]">
            {config.tagline}
          </span>
        </Link>
      </div>
    </header>
  );
}
