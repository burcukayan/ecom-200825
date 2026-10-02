import Image from "next/image";
import Link from "next/link";
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
  currency: Currency;
  category: ProductCategory;
  stock: number;
  imageUrl?: string;
};

export function ProductCard({
  id,
  name,
  description,
  priceCents,
  currency,
  category,
  stock,
  imageUrl,
}: ProductCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <Link
        href={`/products/${id}`}
        className="relative block aspect-4/3 bg-muted"
      >
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
      </Link>
      <CardHeader className="flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 text-base">
            <Link href={`/products/${id}`} className="hover:underline">
              {name}
            </Link>
          </CardTitle>
          <Badge variant="secondary">{formatCategoryLabel(category)}</Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex items-center justify-between gap-4 border-t border-border pt-4">
        <p className="text-lg font-semibold text-foreground">
          {formatPrice(priceCents, currency)}
        </p>
        <AddToCartButton
          disabled={stock <= 0}
          product={{
            id,
            name,
            price: priceCents,
            currency,
            imageUrl: imageUrl ?? "",
          }}
        />
      </CardFooter>
    </Card>
  );
}
