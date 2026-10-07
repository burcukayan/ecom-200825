import { z } from "zod";
import { currencySchema } from "@/lib/validation/currency";
import {
  ACCEPTED_IMAGE_TYPES_SET,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_MB,
} from "@/lib/product-images";
import { ProductCategory } from "@/types/product";
import { priceStringToCents } from "@/types/currency";

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;
const STOCK_PATTERN = /^\d+$/;
const MAX_STOCK = 2_147_483_647;

export const productCategorySchema = z.nativeEnum(ProductCategory);

export const createProductFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().min(1, "Description is required"),
  price: z
    .string()
    .trim()
    .min(1, "Price is required")
    .regex(PRICE_PATTERN, "Enter a valid price (e.g. 19.99)")
    .refine(
      (value) => !PRICE_PATTERN.test(value) || priceStringToCents(value) > 0,
      "Price must be greater than 0",
    ),
  currency: currencySchema,
  category: productCategorySchema,
  stock: z
    .string()
    .trim()
    .min(1, "Stock is required")
    .refine(
      (value) => STOCK_PATTERN.test(value),
      "Stock must be a whole number",
    )
    .refine(
      (value) => !STOCK_PATTERN.test(value) || Number(value) <= MAX_STOCK,
      "Stock is too large",
    ),
  isActive: z.boolean(),
});

export type CreateProductFormInput = z.infer<typeof createProductFormSchema>;

export const createProductDataSchema = createProductFormSchema.transform(
  (values) => ({
    name: values.name,
    description: values.description,
    priceCents: priceStringToCents(values.price),
    currency: values.currency,
    category: values.category,
    stock: Number(values.stock),
    isActive: values.isActive,
  }),
);

export type CreateProductData = z.infer<typeof createProductDataSchema>;

export const productImageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, "Image file is empty")
  .refine(
    (file) => file.size <= MAX_IMAGE_BYTES,
    `Each image must be ${MAX_IMAGE_MB} MB or smaller`,
  )
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES_SET.has(file.type),
    "Only JPEG, PNG, WebP, and GIF images are allowed",
  );

export const createProductImagesSchema = z
  .array(productImageFileSchema)
  .min(1, "At least one product image is required");
