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
  const { categoryValue, sortValue, pageValue, queryValue } =
    parseStorefrontFilters(searchParams);

  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="flex gap-3">
            <div className="h-9 w-full animate-pulse rounded-lg bg-muted sm:max-w-xs" />
            <div className="h-9 w-52 animate-pulse rounded-lg bg-muted" />
            <div className="h-9 w-52 animate-pulse rounded-lg bg-muted" />
          </div>
        }
      >
        <ProductFilters
          category={categoryValue}
          sort={sortValue}
          query={queryValue}
        />
      </Suspense>
      <Suspense
        key={`${queryValue}-${categoryValue}-${sortValue}-${pageValue}`}
        fallback={<ProductGridSkeleton />}
      >
        <ProductGrid
          category={categoryValue}
          sort={sortValue}
          page={pageValue}
          query={queryValue}
        />
      </Suspense>
    </div>
  );
}
