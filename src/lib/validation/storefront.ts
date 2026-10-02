import { z } from "zod";
import { ProductSort } from "@/types/product";
import { productCategorySchema } from "./product";

export const productSortSchema = z.nativeEnum(ProductSort);

export const storefrontCategoryFilterSchema = z.union([
  z.literal("all"),
  productCategorySchema,
]);

export const storefrontFiltersSchema = z.object({
  category: storefrontCategoryFilterSchema.default("all"),
  sort: productSortSchema.default(ProductSort.NAME_ASC),
});

export type StorefrontFiltersInput = z.infer<typeof storefrontFiltersSchema>;

export function parseStorefrontFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): StorefrontFiltersInput {
  const categoryParam = Array.isArray(searchParams.category)
    ? searchParams.category[0]
    : searchParams.category;
  const sortParam = Array.isArray(searchParams.sort)
    ? searchParams.sort[0]
    : searchParams.sort;

  const result = storefrontFiltersSchema.safeParse({
    category: categoryParam ?? "all",
    sort: sortParam ?? ProductSort.NAME_ASC,
  });

  if (result.success) {
    return result.data;
  }

  return { category: "all", sort: ProductSort.NAME_ASC };
}

export function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

const SEARCH_QUERY_MAX_LENGTH = 100;

export function parseSearchParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, SEARCH_QUERY_MAX_LENGTH);
}
