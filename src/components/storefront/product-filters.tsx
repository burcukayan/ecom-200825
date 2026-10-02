"use client";

import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  isProductSort,
  PRODUCT_CATEGORY_FILTER_OPTIONS,
  PRODUCT_SORT_OPTIONS,
  type ProductCategory,
  type ProductSort,
} from "@/types/product";

type ProductFiltersProps = {
  category: ProductCategory | "all";
  sort: ProductSort;
  query: string;
};

export function ProductFilters({ category, sort, query }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilters(
    next: Partial<Pick<ProductFiltersProps, "category" | "sort">>,
  ) {
    const params = new URLSearchParams(searchParams.toString());
    const nextCategory = next.category ?? category;
    const nextSort = next.sort ?? sort;

    if (nextCategory === "all") {
      params.delete("category");
    } else {
      params.set("category", nextCategory);
    }

    params.set("sort", nextSort);
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  function updateQuery(nextQuery: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = nextQuery.trim();

    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }

    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("q");
    updateQuery(typeof value === "string" ? value : "");
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form
        role="search"
        onSubmit={handleSearch}
        className="relative w-full sm:max-w-xs"
      >
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          key={query}
          name="q"
          type="text"
          enterKeyHint="search"
          defaultValue={query}
          placeholder="Search products..."
          aria-label="Search products"
          maxLength={100}
          className="pr-8 pl-8"
        />
        {query ? (
          <button
            type="button"
            onClick={() => updateQuery("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </form>

      <Select
        value={category}
        onValueChange={(value) =>
          updateFilters({ category: value as ProductCategory | "all" })
        }
      >
        <SelectTrigger className="w-full sm:w-52">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {PRODUCT_CATEGORY_FILTER_OPTIONS.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={sort}
        onValueChange={(value) => {
          if (isProductSort(value)) {
            updateFilters({ sort: value });
          }
        }}
      >
        <SelectTrigger className="w-full sm:w-52">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {PRODUCT_SORT_OPTIONS.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
