"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth0";
import { backendFetch } from "@/lib/backend";
import { CARRIERS } from "@/lib/carriers";

export type UpdateOrderStatusState = { error: string } | null;

const orderIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

const updateOrderStatusSchema = z.discriminatedUnion("status", [
  z.object({
    orderId: orderIdSchema,
    status: z.literal("SHIPPING"),
    carrier: z.enum(CARRIERS, { message: "Please select a carrier." }),
    trackingNumber: z
      .string()
      .trim()
      .min(5, "Tracking number must be at least 5 characters.")
      .max(40, "Tracking number must be at most 40 characters.")
      .regex(
        /^[A-Za-z0-9-]+$/,
        "Tracking number may only contain letters, numbers and dashes.",
      ),
  }),
  z.object({ orderId: orderIdSchema, status: z.literal("COMPLETED") }),
]);

export async function updateOrderStatusAction(
  _prevState: UpdateOrderStatusState,
  formData: FormData,
): Promise<UpdateOrderStatusState> {
  await requireAdmin();

  const parsed = updateOrderStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    carrier: formData.get("carrier") ?? undefined,
    trackingNumber: formData.get("trackingNumber") ?? undefined,
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid request." };

  const { orderId, ...payload } = parsed.data;
  const res = await backendFetch(`/v1/admin/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    return { error: body?.error ?? `Update failed (status ${res.status}).` };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return null;
}

const cancelOrderSchema = z.object({
  orderId: z.string().regex(/^[a-f\d]{24}$/i),
});

export async function cancelOrderAction(
  _prevState: UpdateOrderStatusState,
  formData: FormData,
): Promise<UpdateOrderStatusState> {
  await requireAdmin();

  const parsed = cancelOrderSchema.safeParse({
    orderId: formData.get("orderId"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  const res = await backendFetch(
    `/v1/admin/orders/${parsed.data.orderId}/cancel`,
    {
      method: "POST",
    },
  );

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    return { error: body?.error ?? `Cancel failed (status ${res.status}).` };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/products");
  revalidatePath("/orders");
  revalidatePath("/");
  return null;
}
