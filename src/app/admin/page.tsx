import Image from "next/image";
import Link from "next/link";
import { Clock, TrendingUp, Users, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OrderStatus } from "@/lib/orders";
import { STATUS_LABEL } from "@/lib/order-status";
import { getAdminStats, type RevenueByCurrency } from "@/lib/stats";
import { formatPrice } from "@/types/currency";

export const metadata = {
  title: "Dashboard",
};

const STATUS_ORDER: OrderStatus[] = [
  "PAID",
  "SHIPPING",
  "COMPLETED",
  "CANCELLED",
];

function RevenueValue({ revenue }: { revenue: RevenueByCurrency[] }) {
  if (revenue.length === 0) return <p className="text-2xl font-semibold">—</p>;

  return (
    <div className="flex flex-col">
      {revenue.map((row) => (
        <p key={row.currency} className="text-2xl font-semibold">
          {formatPrice(row.totalCents, row.currency)}
        </p>
      ))}
    </div>
  );
}

function orderCountLabel(revenue: RevenueByCurrency[]) {
  const count = revenue.reduce((sum, row) => sum + row.orderCount, 0);
  return `${count} ${count === 1 ? "order" : "orders"}`;
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const awaitingShipment = stats.ordersByStatus.PAID ?? 0;
  const statuses: OrderStatus[] = stats.ordersByStatus.PENDING
    ? ["PENDING", ...STATUS_ORDER]
    : STATUS_ORDER;
  const maxStatusCount = Math.max(
    1,
    ...statuses.map((status) => stats.ordersByStatus[status] ?? 0),
  );

  return (
    <main className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          An overview of sales, orders and stock.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardDescription>Revenue (last 30 days)</CardDescription>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <RevenueValue revenue={stats.revenue.last30Days} />
            <p className="text-xs text-muted-foreground">
              {orderCountLabel(stats.revenue.last30Days)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardDescription>Revenue (all time)</CardDescription>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <RevenueValue revenue={stats.revenue.allTime} />
            <p className="text-xs text-muted-foreground">
              {orderCountLabel(stats.revenue.allTime)}, excluding cancelled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardDescription>Awaiting shipment</CardDescription>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold">{awaitingShipment}</p>
            <Link
              href="/admin/orders"
              className="text-xs text-primary hover:underline"
            >
              Go to orders
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardDescription>Customers</CardDescription>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold">{stats.customerCount}</p>
            <Link
              href="/admin/users"
              className="text-xs text-primary hover:underline"
            >
              View users
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statuses.map((status) => {
              const count = stats.ordersByStatus[status] ?? 0;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{STATUS_LABEL[status]}</span>
                    <span className="font-medium tabular-nums">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className={
                        status === "CANCELLED"
                          ? "h-2 rounded-full bg-destructive"
                          : "h-2 rounded-full bg-primary"
                      }
                      style={{ width: `${(count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top products</CardTitle>
            <CardDescription>
              By units sold, excluding cancelled orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            ) : (
              <ol className="space-y-3">
                {stats.topProducts.map((product, index) => (
                  <li
                    key={product.productId}
                    className="flex items-center gap-3"
                  >
                    <span className="w-4 text-sm text-muted-foreground tabular-nums">
                      {index + 1}
                    </span>
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted" />
                    )}
                    <span
                      className="flex-1 truncate text-sm font-medium"
                      title={product.name}
                    >
                      {product.name}
                    </span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {product.quantitySold} sold
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low stock</CardTitle>
            <CardDescription>
              Active products with {stats.lowStockThreshold} or fewer in stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All products are well stocked.
              </p>
            ) : (
              <ul className="space-y-3">
                {stats.lowStock.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="truncate text-sm font-medium hover:underline"
                      title={product.name}
                    >
                      {product.name}
                    </Link>
                    <Badge
                      variant={product.stock === 0 ? "destructive" : "outline"}
                    >
                      {product.stock === 0
                        ? "Out of stock"
                        : `${product.stock} left`}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
