import { Suspense } from "react";

import { ProductFilters } from "@/components/storefront/product-filters";
import {
  ProductGrid,
  ProductGridSkeleton,
} from "@/components/storefront/product-grid";
import { parseStorefrontFilters } from "@/lib/products";
type ProductCatalogProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export function ProductCatalog({ searchParams }: ProductCatalogProps) {
  const { categoryValue, sortValue } = parseStorefrontFilters(searchParams);

  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="flex gap-3">
            <div className="h-9 w-52 animate-pulse rounded-lg bg-muted" />
            <div className="h-9 w-52 animate-pulse rounded-lg bg-muted" />
          </div>
        }
      >
        <ProductFilters category={categoryValue} sort={sortValue} />
      </Suspense>
      <Suspense
        key={`${categoryValue}-${sortValue}`}
        fallback={<ProductGridSkeleton />}
      >
        <ProductGrid category={categoryValue} sort={sortValue} />
      </Suspense>
    </div>
  );
}
