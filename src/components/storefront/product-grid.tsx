import { ProductCard } from "@/components/storefront/product-card";
import { ProductPagination } from "@/components/storefront/product-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { getStorefrontProducts } from "@/lib/products";
import type { ProductCategory, ProductSort } from "@/types/product";

type ProductGridProps = {
  category: ProductCategory | "all";
  sort: ProductSort;
  page: number;
  query: string;
};

export async function ProductGrid({
  category,
  sort,
  page,
  query,
}: ProductGridProps) {
  const {
    products,
    total,
    page: currentPage,
    totalPages,
    pageSize,
  } = await getStorefrontProducts({ category, sort, page, query });

  if (products.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">
          {query ? `No results for "${query}"` : "No products available yet"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {query
            ? "Check the spelling or try a different search term or category."
            : category === "all"
              ? "Check back soon, new items will appear here."
              : "No products in this category. Try another filter."}
        </p>
      </div>
    );
  }

  const from = (currentPage - 1) * pageSize + 1;
  const to = from + products.length - 1;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total} products
        {query ? ` for "${query}"` : null}
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            description={product.description}
            priceCents={product.priceCents}
            currency={product.currency}
            category={product.category}
            stock={product.stock}
            imageUrl={product.imageUrls[0]}
          />
        ))}
      </div>

      <ProductPagination
        category={category}
        sort={sort}
        query={query}
        page={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <Skeleton className="aspect-4/3 w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
