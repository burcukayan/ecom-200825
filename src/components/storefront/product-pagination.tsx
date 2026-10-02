import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductCategory, ProductSort } from "@/types/product";

type ProductPaginationProps = {
  category: ProductCategory | "all";
  sort: ProductSort;
  page: number;
  totalPages: number;
  query: string;
};

function pageHref(
  category: ProductCategory | "all",
  sort: ProductSort,
  query: string,
  page: number,
) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category !== "all") params.set("category", category);
  params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  return `/?${params.toString()}`;
}

export function ProductPagination({
  category,
  sort,
  query,
  page,
  totalPages,
}: ProductPaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-3"
    >
      {hasPrevious ? (
        <Button asChild variant="outline" size="sm">
          <Link href={pageHref(category, sort, query, page - 1)}>
            <ChevronLeft className="size-4" />
            Previous
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft className="size-4" />
          Previous
        </Button>
      )}

      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      {hasNext ? (
        <Button asChild variant="outline" size="sm">
          <Link href={pageHref(category, sort, query, page + 1)}>
            Next
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Next
          <ChevronRight className="size-4" />
        </Button>
      )}
    </nav>
  );
}
