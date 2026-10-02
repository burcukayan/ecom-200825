import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { getStorefrontProductById } from "@/lib/products";
import { formatPrice } from "@/types/currency";
import { formatCategoryLabel } from "@/types/product";
import { ProductGallery } from "./product-gallery";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

const LOW_STOCK_THRESHOLD = 5;

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getStorefrontProductById(id);
  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: { images: product.imageUrls.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getStorefrontProductById(id);
  if (!product) notFound();

  const inStock = product.stock > 0;
  const lowStock = inStock && product.stock <= LOW_STOCK_THRESHOLD;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to products
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery name={product.name} imageUrls={product.imageUrls} />

        <div className="flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit">
            {formatCategoryLabel(product.category)}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">
            {product.name}
          </h1>
          <p className="text-2xl font-semibold">
            {formatPrice(product.priceCents, product.currency)}
          </p>

          <p
            className={
              inStock
                ? "text-sm text-muted-foreground"
                : "text-sm text-destructive"
            }
          >
            {!inStock
              ? "Out of stock"
              : lowStock
                ? `Only ${product.stock} left in stock`
                : "In stock"}
          </p>

          <div className="w-fit">
            <AddToCartButton
              disabled={!inStock}
              product={{
                id: product.id,
                name: product.name,
                price: product.priceCents,
                currency: product.currency,
                imageUrl: product.imageUrls[0] ?? "",
              }}
            />
          </div>

          <div className="border-t border-border pt-4">
            <h2 className="mb-2 text-sm font-medium">Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
