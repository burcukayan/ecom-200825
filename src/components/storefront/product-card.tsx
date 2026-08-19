"use client";

import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Currency, formatPrice } from "@/types/currency";
import { formatCategoryLabel, type ProductCategory } from "@/types/product";
import { AddToCartButton } from "./add-to-cart-button";

type ProductCardProps = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  category: ProductCategory;
  imageUrl?: string;
  stripePriceId?: string | null;
};

export function ProductCard({
  id,
  name,
  description,
  priceCents,
  currency,
  category,
  imageUrl,
  stripePriceId,
}: ProductCardProps) {
  const priceLabel = formatPrice(priceCents, currency as Currency);

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="relative aspect-4/3 bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <CardHeader className="gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 text-base">{name}</CardTitle>
          <Badge variant="secondary">{formatCategoryLabel(category)}</Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardFooter className="border-t border-border pt-4 flex items-center justify-between gap-4">
        <p className="text-lg font-semibold text-foreground">{priceLabel}</p>

        <div className="shrink-0">
          <AddToCartButton
            product={{
              id: id,
              name: name,
              price: priceCents,
              currency: currency,
              imageUrl: imageUrl || "",
              stripePriceId: stripePriceId || "",
            }}
          />
        </div>
      </CardFooter>
    </Card>
  );
}
