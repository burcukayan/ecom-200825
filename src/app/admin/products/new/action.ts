"use server";

import {
  createProductDataSchema,
  createProductImagesSchema,
} from "@/lib/validation";
import { createProduct as createProductRecord } from "@/lib/products";
import { Currency } from "@/types/currency";
import { ProductCategory } from "@/types/product";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export type CreateProductFormValues = {
  name: string;
  description: string;
  price: string;
  currency: Currency;
  category: ProductCategory;
  stock: string;
  isActive: boolean;
};

export type CreateProductFieldErrors = Partial<
  Record<keyof CreateProductFormValues | "images", string>
>;

export type CreateProductState = {
  message: string;
  values?: CreateProductFormValues;
  fieldErrors?: CreateProductFieldErrors;
};

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

function flattenFieldErrors(
  fieldErrors: Record<string, string[] | undefined>,
): CreateProductFieldErrors {
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([key, messages]) => [
      key,
      messages?.[0] ?? "",
    ]),
  ) as CreateProductFieldErrors;
}

export async function createProduct(
  _prevState: CreateProductState | null,
  formData: FormData,
): Promise<CreateProductState | null> {
  const values = parseFormValues(formData);

  const parsed = createProductDataSchema.safeParse(values);
  if (!parsed.success) {
    return {
      message: "Please fix the errors below.",
      values,
      fieldErrors: flattenFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  const images = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File);
  const imagesParsed = createProductImagesSchema.safeParse(images);
  if (!imagesParsed.success) {
    return {
      message: "Please fix the errors below.",
      values,
      fieldErrors: {
        images: imagesParsed.error.issues[0]?.message ?? "Invalid images",
      },
    };
  }

  const imageUrls = await Promise.all(
    imagesParsed.data.map(async (imageFile) => {
      const blob = await put(imageFile.name, imageFile, {
        access: "public",
        addRandomSuffix: true,
      });

      return blob.url;
    }),
  );

  let productId: string;
  try {
    const result = await createProductRecord(parsed.data, imageUrls);
    productId = result.id;
  } catch {
    return {
      message: "Could not create the product. Please try again.",
      values,
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect(`/admin/products/new?created=${productId}`);
}

export async function deleteProductAction(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) return;

  if (product.imageUrls && product.imageUrls.length > 0) {
    await del(product.imageUrls);
  }

  await prisma.product.delete({
    where: { id: productId },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
}

export type UpdateProductState = CreateProductState;

export async function updateProductAction(
  productId: string,
  _prevState: UpdateProductState | null,
  formData: FormData,
): Promise<UpdateProductState | null> {
  const values = parseFormValues(formData);

  const parsed = createProductDataSchema.safeParse(values);
  if (!parsed.success) {
    return {
      message: "Please fix the errors below.",
      values,
      fieldErrors: flattenFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  const images = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  let imageUrls: string[] | undefined = undefined;

  if (images.length > 0) {
    const imagesParsed = createProductImagesSchema.safeParse(images);
    if (!imagesParsed.success) {
      return {
        message: "Please fix the image errors below.",
        values,
        fieldErrors: {
          images: imagesParsed.error.issues[0]?.message ?? "Invalid images",
        },
      };
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (existingProduct?.imageUrls?.length) {
      await del(existingProduct.imageUrls);
    }

    imageUrls = await Promise.all(
      imagesParsed.data.map(async (imageFile) => {
        const blob = await put(imageFile.name, imageFile, {
          access: "public",
          addRandomSuffix: true,
        });
        return blob.url;
      }),
    );
  }

  try {
    await prisma.product.update({
      where: { id: productId },
      data: {
        ...parsed.data as any,
        ...(imageUrls && { imageUrls }),
      },
    });
  } catch {
    return {
      message: "Could not update the product. Please try again.",
      values,
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}
