import { cache } from "react";
import type { Prisma, Product as PrismaProduct } from "@prisma/client";
import {
  parsePageParam,
  parseSearchParam,
  parseStorefrontFiltersFromSearchParams,
} from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { Currency } from "@/types/currency";
import { ProductCategory, ProductSort } from "@/types/product";

export type Product = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: Currency;
  category: ProductCategory;
  stock: number;
  imageUrls: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  stripePriceId: string | null;
  stripeProductId: string | null;
};

export type GetStorefrontProductsFilters = {
  category?: ProductCategory | "all";
  sort?: ProductSort;
  page?: number;
  query?: string;
};

export type StorefrontProductsPage = {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
};

export const STOREFRONT_PAGE_SIZE = 9;

export const isObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

function toProduct(record: PrismaProduct): Product {
  return {
    ...record,
    currency: record.currency as Currency,
    category: record.category as ProductCategory,
  };
}

const ORDER_BY: Record<ProductSort, Prisma.ProductOrderByWithRelationInput> = {
  [ProductSort.NAME_ASC]: { name: "asc" },
  [ProductSort.NAME_DESC]: { name: "desc" },
  [ProductSort.PRICE_ASC]: { priceCents: "asc" },
  [ProductSort.PRICE_DESC]: { priceCents: "desc" },
};

export async function getStorefrontProducts({
  category = "all",
  sort = ProductSort.NAME_ASC,
  page = 1,
  query = "",
}: GetStorefrontProductsFilters = {}): Promise<StorefrontProductsPage> {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(category !== "all" && { category }),
    ...(query && {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    }),
  };

  const total = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / STOREFRONT_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const records = await prisma.product.findMany({
    where,
    orderBy: [ORDER_BY[sort], { id: "asc" }],
    skip: (safePage - 1) * STOREFRONT_PAGE_SIZE,
    take: STOREFRONT_PAGE_SIZE,
  });

  return {
    products: records.map(toProduct),
    total,
    page: safePage,
    totalPages,
    pageSize: STOREFRONT_PAGE_SIZE,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const records = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  return records.map(toProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!isObjectId(id)) return null;
  const record = await prisma.product.findUnique({ where: { id } });
  return record ? toProduct(record) : null;
}

export const getStorefrontProductById = cache(
  async (id: string): Promise<Product | null> => {
    const product = await getProductById(id);
    return product?.isActive ? product : null;
  },
);

export function parseStorefrontFilters(
  searchParams: Record<string, string | string[] | undefined>,
): {
  categoryValue: ProductCategory | "all";
  sortValue: ProductSort;
  pageValue: number;
  queryValue: string;
} {
  const { category, sort } =
    parseStorefrontFiltersFromSearchParams(searchParams);
  return {
    categoryValue: category,
    sortValue: sort,
    pageValue: parsePageParam(searchParams.page),
    queryValue: parseSearchParam(searchParams.q),
  };
}
