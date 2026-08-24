"use client";

import { useState } from "react";

export default function ItemPhotos({
  images,
  title,
  sold,
}: {
  images: string[];
  title: string;
  sold: boolean;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-xl bg-card border border-line flex items-center justify-center text-muted">
        No photo
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-card border border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]}
          alt={title}
          className={`h-full w-full object-cover ${sold ? "grayscale opacity-80" : ""}`}
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={`h-16 w-16 overflow-hidden rounded-md border-2 transition ${
                i === active ? "border-foreground" : "border-line hover:border-foreground/40"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
