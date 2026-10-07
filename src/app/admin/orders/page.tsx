import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminOrders, type OrderStatus } from "@/lib/orders";
import { formatPrice } from "@/types/currency";
import { OrderStatusButton } from "./order-status-button";
import { requireAdmin } from "@/lib/auth0";

export const metadata = {
  title: "Orders",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  SHIPPING: "Shipping",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_VARIANT: Record<
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

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await getAdminOrders();

  return (
    <main className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Orders
        </h1>
        <p className="text-sm text-muted-foreground">
          View and manage customer orders.
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No orders yet</CardTitle>
            <CardDescription>
              Orders will appear here after a successful checkout.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">
                    #{order.id.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {dateFormatter.format(new Date(order.createdAt))}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{order.user.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.user.email}
                    </p>
                  </TableCell>
                  <TableCell>
                    <ul className="space-y-0.5 text-sm">
                      {order.orderItems.map((item) => (
                        <li key={item.id}>
                          {item.quantity} × {item.name}
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(order.totalCents, order.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[order.status]}>
                      {STATUS_LABEL[order.status]}
                    </Badge>
                    {order.trackingNumber ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.carrier} ·{" "}
                        <span className="font-mono">
                          {order.trackingNumber}
                        </span>
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <OrderStatusButton
                      orderId={order.id}
                      currentStatus={order.status}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
