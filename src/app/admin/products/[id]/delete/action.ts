"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del } from "@vercel/blob";
import { requireAdmin } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { isObjectId } from "@/lib/products";


export async function deleteProduct(id: string) {
  await requireAdmin();

  if (!isObjectId(id)) throw new Error("Product not found");

  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!product) throw new Error("Product not found");

  if (product.stripeProductId) {
    await stripe.products.update(product.stripeProductId, { active: false });
  }

  if (product._count.orderItems > 0) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.product.delete({ where: { id } });
    if (product.imageUrls.length) {
      await del(product.imageUrls).catch((err) => console.error("Image cleanup failed:", err));
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}
