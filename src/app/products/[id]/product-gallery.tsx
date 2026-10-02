"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  name: string;
  imageUrls: string[];
};

export function ProductGallery({ name, imageUrls }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const current = imageUrls[selected];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        {current ? (
          <Image
            src={current}
            alt={name}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>

      {imageUrls.length > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {imageUrls.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Show image ${index + 1}`}
              aria-current={index === selected}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md border-2 bg-muted",
                index === selected
                  ? "border-primary"
                  : "border-transparent hover:border-border",
              )}
            >
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes="96px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
