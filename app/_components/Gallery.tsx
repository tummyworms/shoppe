import Link from "next/link";
import type { Item } from "@/lib/types";

export default function Gallery({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <p className="text-center text-muted py-24">
        No pieces listed yet — check back soon.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {items.map((item, idx) => (
        <ItemCard key={item.id} item={item} idx={idx} />
      ))}
    </div>
  );
}

function ItemCard({ item, idx }: { item: Item; idx: number }) {
  const cover = item.images[0];
  return (
    <Link
      href={`/item/${item.id}`}
      className="group rise block"
      style={{ animationDelay: `${Math.min(idx, 12) * 30}ms` }}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-card border border-line">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={item.title}
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] ${
              item.sold ? "grayscale opacity-70" : ""
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted text-sm">
            No photo
          </div>
        )}
        {item.sold && (
          <span className="absolute left-3 top-3 rounded-full bg-foreground/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-background">
            Sold
          </span>
        )}
      </div>
      <div className="mt-3 px-0.5">
        <p className="font-display text-lg leading-snug">{item.title}</p>
        <p className="text-xs uppercase tracking-wider text-muted mt-0.5">
          {item.category}
        </p>
      </div>
    </Link>
  );
}
