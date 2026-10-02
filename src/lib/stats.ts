import "server-only";
import { backendFetch } from "@/lib/backend";
import type { OrderStatus } from "@/lib/orders";
import type { Currency } from "@/types/currency";

export type RevenueByCurrency = {
  currency: Currency;
  totalCents: number;
  orderCount: number;
};

export type AdminStats = {
  revenue: { allTime: RevenueByCurrency[]; last30Days: RevenueByCurrency[] };
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  topProducts: {
    productId: string;
    name: string;
    imageUrl: string | null;
    quantitySold: number;
  }[];
  lowStock: { id: string; name: string; stock: number }[];
  lowStockThreshold: number;
  customerCount: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const res = await backendFetch("/v1/admin/stats");
  if (!res.ok)
    throw new Error(`Could not load dashboard stats (status ${res.status})`);
  return (await res.json()) as AdminStats;
}
