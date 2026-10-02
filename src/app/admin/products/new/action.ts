"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put, del } from "@vercel/blob";
import { createProductDataSchema, createProductImagesSchema } from "@/lib/validation";
import { requireAdmin } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { isObjectId } from "@/lib/products";
import { Currency } from "@/types/currency";
import { ProductCategory } from "@/types/product";

export type CreateProductFormValues = {
  name: string;
  description: string;
  price: string;
  currency: Currency;
  category: ProductCategory;
  stock: string;
  isActive: boolean;
};

export type CreateProductFieldErrors = Partial<Record<keyof CreateProductFormValues | "images", string>>;

export type CreateProductState = {
  message: string;
  values?: CreateProductFormValues;
  fieldErrors?: CreateProductFieldErrors;
};

export type UpdateProductState = CreateProductState;

function parseFormValues(formData: FormData): CreateProductFormValues {
  return {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: String(formData.get("price") ?? ""),
    currency: String(formData.get("currency") ?? "") as Currency,
    category: String(formData.get("category") ?? "") as ProductCategory,
    stock: String(formData.get("stock") ?? ""),
    isActive: formData.get("isActive") === "on",
  };
}

function flattenFieldErrors(fieldErrors: Record<string, string[] | undefined>): CreateProductFieldErrors {
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([key, messages]) => [key, messages?.[0] ?? ""]),
  ) as CreateProductFieldErrors;
}

function getImageFiles(formData: FormData) {
  return formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

async function uploadImages(files: File[]) {
  return Promise.all(
    files.map(async (file) => {
      const blob = await put(`products/${file.name}`, file, { access: "public", addRandomSuffix: true });
      return blob.url;
    }),
  );
}

export async function createProduct(
  _prevState: CreateProductState | null,
  formData: FormData,
): Promise<CreateProductState | null> {
  await requireAdmin();

  const values = parseFormValues(formData);
  const parsed = createProductDataSchema.safeParse(values);
  if (!parsed.success) {
    return {
      message: "Please fix the errors below.",
      values,
      fieldErrors: flattenFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  const imagesParsed = createProductImagesSchema.safeParse(getImageFiles(formData));
  if (!imagesParsed.success) {
    return {
      message: "Please fix the errors below.",
      values,
      fieldErrors: { images: imagesParsed.error.issues[0]?.message ?? "Invalid images" },
    };
  }

  const data = parsed.data;
  let imageUrls: string[] = [];
  let stripeProductId: string | null = null;
  let productId: string;

  try {
    imageUrls = await uploadImages(imagesParsed.data);

    const stripeProduct = await stripe.products.create({
      name: data.name,
      description: data.description,
      images: imageUrls,
      active: data.isActive,
      default_price_data: {
        currency: data.currency.toLowerCase(),
        unit_amount: data.priceCents,
      },
    });
    stripeProductId = stripeProduct.id;

    const record = await prisma.product.create({
      data: {
        ...data,
        imageUrls,
        stripeProductId: stripeProduct.id,
        stripePriceId: stripeProduct.default_price as string,
      },
    });
    productId = record.id;
  } catch (error) {
    console.error("Create product failed, rolling back:", error);
    await Promise.allSettled([
      imageUrls.length ? del(imageUrls) : Promise.resolve(),
      stripeProductId ? stripe.products.update(stripeProductId, { active: false }) : Promise.resolve(),
    ]);
    return { message: "Could not create the product. Please try again.", values };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect(`/admin/products/new?created=${productId}`);
}

export async function updateProductAction(
  productId: string,
  _prevState: UpdateProductState | null,
  formData: FormData,
): Promise<UpdateProductState | null> {
  await requireAdmin();

  const values = parseFormValues(formData);
  if (!isObjectId(productId)) return { message: "Product not found.", values };

  const parsed = createProductDataSchema.safeParse(values);
  if (!parsed.success) {
    return {
      message: "Please fix the errors below.",
      values,
      fieldErrors: flattenFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) return { message: "Product not found.", values };

  const files = getImageFiles(formData);
  if (files.length > 0) {
    const imagesParsed = createProductImagesSchema.safeParse(files);
    if (!imagesParsed.success) {
      return {
        message: "Please fix the image errors below.",
        values,
        fieldErrors: { images: imagesParsed.error.issues[0]?.message ?? "Invalid images" },
      };
    }
  }

  const data = parsed.data;
  let newImageUrls: string[] | undefined;

  try {
    if (files.length > 0) newImageUrls = await uploadImages(files);

    let stripePriceId = existing.stripePriceId;

    if (existing.stripeProductId) {
      const priceChanged =
        data.priceCents !== existing.priceCents || data.currency !== existing.currency;

      if (priceChanged) {
        const newPrice = await stripe.prices.create({
          product: existing.stripeProductId,
          unit_amount: data.priceCents,
          currency: data.currency.toLowerCase(),
        });
        stripePriceId = newPrice.id;
      }

      await stripe.products.update(existing.stripeProductId, {
        name: data.name,
        description: data.description,
        active: data.isActive,
        ...(newImageUrls && { images: newImageUrls }),
        ...(priceChanged && stripePriceId && { default_price: stripePriceId }),
      });

      if (priceChanged && existing.stripePriceId) {
        await stripe.prices.update(existing.stripePriceId, { active: false });
      }
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        ...data,
        stripePriceId,
        ...(newImageUrls && { imageUrls: newImageUrls }),
      },
    });
  } catch (error) {
    console.error("Update product failed:", error);
    if (newImageUrls?.length) await del(newImageUrls).catch(() => undefined);
    return { message: "Could not update the product. Please try again.", values };
  }

  if (newImageUrls && existing.imageUrls.length) {
    await del(existing.imageUrls).catch((err) => console.error("Old image cleanup failed:", err));
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}
