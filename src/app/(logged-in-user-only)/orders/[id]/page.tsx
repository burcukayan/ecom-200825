import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth0";
import { getMyOrder } from "@/lib/orders";
import {
  STATUS_LABEL,
  STATUS_VARIANT,
  formatOrderDate,
  shortOrderId,
} from "@/lib/order-status";
import { formatPrice } from "@/types/currency";
import { CancelOrderButton } from "./cancel-order-button";
import { OrderTimeline } from "./order-timeline";

type OrderPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: OrderPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order #${shortOrderId(id)}` };
}

export default async function OrderPage({ params }: OrderPageProps) {
  await requireUser();
  const { id } = await params;
  const order = await getMyOrder(id);
  if (!order) notFound();

  const canCancel = order.status === "PAID";

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <Link
        href="/orders"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to my orders
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Order #{shortOrderId(order.id)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Placed on {formatOrderDate(order.createdAt)}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[order.status]}>
          {STATUS_LABEL[order.status]}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Items</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {order.orderItems.map((item) => {
              const imageUrl = item.product?.imageUrls[0];
              const productHref = item.product?.isActive
                ? `/products/${item.productId}`
                : null;

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
                    {productHref ? (
                      <Link
                        href={productHref}
                        className="font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <p className="font-medium">{item.name}</p>
                    )}
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
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline order={order} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <div>
                <p className="font-medium">Shipping address</p>
                <p className="text-muted-foreground">
                  {order.shippingAddress ?? "—"}
                </p>
              </div>
              {order.trackingNumber ? (
                <div>
                  <p className="font-medium">Shipment</p>
                  <p className="text-muted-foreground">{order.carrier}</p>
                  <p className="font-mono select-all break-all">
                    {order.trackingNumber}
                  </p>
                </div>
              ) : null}

              {order.receiptUrl ? (
                <Button asChild variant="outline" className="w-full">
                  <a
                    href={order.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View receipt
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
              ) : null}

              {canCancel ? <CancelOrderButton orderId={order.id} /> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
