import type { OrderStatus } from "@/lib/orders";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  SHIPPING: "Shipping",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const STATUS_VARIANT: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  PAID: "default",
  SHIPPING: "secondary",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

export function formatOrderDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return dateFormatter.format(date);
}

export function shortOrderId(id: string): string {
  return id.slice(-8).toUpperCase();
}
