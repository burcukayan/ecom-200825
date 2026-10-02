import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth0";
import { getMyOrders, type OrderStatus } from "@/lib/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/types/currency";

export const metadata = { title: "My Orders" };

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

export default async function OrdersPage() {
  await requireUser();
  const orders = await getMyOrders();

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <h1 className="mb-4 text-2xl font-bold">My Orders</h1>
        <p className="mb-6 text-muted-foreground">You have no orders yet.</p>
        <Button asChild>
          <Link href="/">Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">My Orders</h1>

      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">
                  Order #{order.id.slice(-8).toUpperCase()}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {dateFormatter.format(new Date(order.createdAt))}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[order.status]}>
                {STATUS_LABEL[order.status]}
              </Badge>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              {order.orderItems.map((item) => {
                const imageUrl = item.product?.imageUrls[0];
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={item.name}
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-md bg-muted" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} ×{" "}
                        {formatPrice(item.priceCents, item.currency)}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatPrice(
                        item.priceCents * item.quantity,
                        item.currency,
                      )}
                    </p>
                  </div>
                );
              })}

              <div className="flex justify-between border-t pt-3 font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.totalCents, order.currency)}</span>
              </div>
              <Button asChild variant="outline" size="sm" className="self-end">
                <Link href={`/orders/${order.id}`}>View details</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
