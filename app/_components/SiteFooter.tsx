import Link from "next/link";
import { config } from "@/lib/config";
import { messengerUrl } from "@/lib/config";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line mt-16">
      <div className="mx-auto max-w-6xl px-5 py-10 flex flex-col items-center gap-4 text-center">
        <p className="font-display text-xl font-bold uppercase tracking-wide">
          {config.shopName}
        </p>
        <a
          href={messengerUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#0866ff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0655d0] transition-colors"
        >
          Message us on Facebook
        </a>
        <p className="text-xs text-muted max-w-md">
          Message us on Facebook for pricing, shipping, or to arrange a time to
          see a piece in person.
        </p>
        <Link
          href="/add"
          className="text-[11px] uppercase tracking-widest text-muted/60 hover:text-muted"
        >
          Manage inventory
        </Link>
      </div>
    </footer>
  );
}
