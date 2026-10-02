import "server-only";
import { backendFetch } from "@/lib/backend";
import type { Currency } from "@/types/currency";

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "SHIPPING"
  | "COMPLETED"
  | "CANCELLED";

export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  priceCents: number;
  currency: Currency;
  productId: string;
  product: { imageUrls: string[] } | null;
};

export type Order = {
  id: string;
  status: OrderStatus;
  totalCents: number;
  currency: Currency;
  createdAt: string;
  orderItems: OrderItem[];
};

export async function getMyOrders(): Promise<Order[]> {
  const res = await backendFetch("/v1/orders");
  if (!res.ok) throw new Error(`Could not load orders (status ${res.status})`);
  return (await res.json()) as Order[];
}

export type OrderDetail = Omit<Order, "orderItems"> & {
  email: string | null;
  shippingAddress: string | null;
  shippedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  refunded: boolean;
  receiptUrl: string | null;
  orderItems: (Omit<OrderItem, "product"> & {
    product: { imageUrls: string[]; isActive: boolean } | null;
  })[];
};

export async function getMyOrder(id: string): Promise<OrderDetail | null> {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;

  const res = await backendFetch(`/v1/orders/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Could not load order (status ${res.status})`);
  return (await res.json()) as OrderDetail;
}

export type AdminOrder = Omit<Order, "orderItems"> & {
  carrier: string | null;
  trackingNumber: string | null;
  user: { name: string | null; email: string };
  orderItems: Omit<OrderItem, "productId" | "product">[];
};

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const res = await backendFetch("/v1/admin/orders");
  if (!res.ok) throw new Error(`Could not load orders (status ${res.status})`);
  return (await res.json()) as AdminOrder[];
}
