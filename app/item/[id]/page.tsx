import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getItem } from "@/lib/store";
import MessengerButton from "@/app/_components/MessengerButton";
import ItemPhotos from "@/app/_components/ItemPhotos";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id);
  return { title: item ? item.title : "Item" };
}

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <Link
        href="/"
        className="text-sm text-muted hover:text-foreground inline-flex items-center gap-1"
      >
        ← Back to collection
      </Link>

      <div className="mt-6 grid md:grid-cols-2 gap-8 lg:gap-12">
        <ItemPhotos images={item.images} title={item.title} sold={item.sold} />

        <div className="md:pt-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            {item.category}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 leading-tight">
            {item.title}
          </h1>

          {item.sold && (
            <p className="mt-3 inline-block rounded-full bg-foreground px-3 py-1 text-xs font-semibold uppercase tracking-wider text-background">
              Sold
            </p>
          )}

          {item.note && (
            <p className="mt-5 whitespace-pre-line leading-relaxed text-foreground/80">
              {item.note}
            </p>
          )}

          <div className="mt-8 border-t border-line pt-8">
            <p className="text-sm text-muted mb-3">
              {item.sold
                ? "This piece has sold — message us to see what else is available."
                : "Interested? Message us on Facebook for pricing, shipping, or to arrange a time to see it."}
            </p>
            <MessengerButton className="w-full md:w-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
