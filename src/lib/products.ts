import type { Product as PrismaProduct } from "@prisma/client";

import { parseStorefrontFiltersFromSearchParams } from "@/lib/validation";
import type { CreateProductData } from "@/lib/validation/product";
import { prisma } from "@/lib/prisma";
import { Currency, isCurrency } from "@/types/currency";
import {
  isProductCategory,
  type ProductCategory,
  type ProductSort,
} from "@/types/product";

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
  stripePriceId?: string; 
};

export type GetStorefrontProductsFilters = {
  category?: ProductCategory | "all";
  sort?: ProductSort;
};

function toProduct(record: PrismaProduct): Product {
  if (!isCurrency(record.currency)) {
    throw new Error(`Unsupported currency: ${record.currency}`);
  }
  if (!isProductCategory(record.category)) {
    throw new Error(`Unsupported category: ${record.category}`);
  }

  return {
    id: record.id,
    name: record.name,
    description: record.description,
    priceCents: record.priceCents,
    currency: record.currency,
    category: record.category,
    stock: record.stock,
    imageUrls: record.imageUrls,
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    stripePriceId: (record as any).stripePriceId || null,
  };
}

export async function getStorefrontProducts(
  _filters: GetStorefrontProductsFilters = {},
): Promise<Product[]> {
  try {
    const records = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return records.map(toProduct);
  } catch (error) {
    console.error("An error occured when fetching all products from DB", error);
    return [];
  }
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const records = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    return records.map(toProduct);
  } catch (error) {
    console.error("An error occured when fetching all products from DB", error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const record = await prisma.product.findUnique({
      where: { id },
    });
    
    if (!record) return null;
    
    return toProduct(record); 
  } catch (error) {
    console.error(`An error occurred when fetching product ${id}`, error);
    return null;
  }
}

export async function createProduct(
  data: CreateProductData,
  imageUrls: string[],
): Promise<Product> {
  const record = await prisma.product.create({
    data: {
      ...data,
      imageUrls,
    },
  });
  return toProduct(record);
}

export function parseStorefrontFilters(
  searchParams: Record<string, string | string[] | undefined>,
): { categoryValue: ProductCategory | "all"; sortValue: ProductSort } {
  const { category, sort } =
    parseStorefrontFiltersFromSearchParams(searchParams);

  return { categoryValue: category, sortValue: sort };
}
