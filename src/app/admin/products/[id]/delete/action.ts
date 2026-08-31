"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function deleteProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  if (product.stripePriceId) {
    await stripe.prices.update(product.stripePriceId, { active: false });
  }

  if (product.stripeProductId) {
    await stripe.products.update(product.stripeProductId, { active: false });
  }

  await prisma.product.delete({
    where: { id },
  });

  redirect("/admin/products");
}
