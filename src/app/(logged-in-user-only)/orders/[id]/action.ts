"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth0";
import { backendFetch } from "@/lib/backend";

export type CancelMyOrderState = { error: string } | null;

const cancelMyOrderSchema = z.object({
  orderId: z.string().regex(/^[a-f\d]{24}$/i),
});

export async function cancelMyOrderAction(
  _prevState: CancelMyOrderState,
  formData: FormData,
): Promise<CancelMyOrderState> {
  await requireUser();

  const parsed = cancelMyOrderSchema.safeParse({
    orderId: formData.get("orderId"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  const { orderId } = parsed.data;
  const res = await backendFetch(`/v1/orders/${orderId}/cancel`, {
    method: "POST",
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    return { error: body?.error ?? `Cancel failed (status ${res.status}).` };
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/products");
  revalidatePath("/");
  return null;
}
