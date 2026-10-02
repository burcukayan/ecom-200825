import { CircleCheck, CircleX, Circle } from "lucide-react";
import type { OrderDetail } from "@/lib/orders";
import { formatOrderDate } from "@/lib/order-status";
import { cn } from "@/lib/utils";

type Step = {
  label: string;
  date: string | null;
  state: "done" | "upcoming" | "cancelled";
  note?: string;
};

function getSteps(order: OrderDetail): Step[] {
  const placed: Step = {
    label: "Order placed",
    date: order.createdAt,
    state: "done",
  };

  if (order.status === "CANCELLED") {
    return [
      placed,
      {
        label: "Cancelled",
        date: order.cancelledAt,
        state: "cancelled",
        note: order.refunded
          ? "The full amount was refunded to your original payment method."
          : undefined,
      },
    ];
  }

  const shipped = order.status === "SHIPPING" || order.status === "COMPLETED";
  const delivered = order.status === "COMPLETED";

  return [
    placed,
    {
      label: "Shipped",
      date: order.shippedAt,
      state: shipped ? "done" : "upcoming",
    },
    {
      label: "Delivered",
      date: order.completedAt,
      state: delivered ? "done" : "upcoming",
    },
  ];
}

export function OrderTimeline({ order }: { order: OrderDetail }) {
  const steps = getSteps(order);

  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const Icon =
          step.state === "done"
            ? CircleCheck
            : step.state === "cancelled"
              ? CircleX
              : Circle;
        const isLast = index === steps.length - 1;

        return (
          <li key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <Icon
                aria-hidden
                className={cn(
                  "size-5 shrink-0",
                  step.state === "done" && "text-primary",
                  step.state === "cancelled" && "text-destructive",
                  step.state === "upcoming" && "text-muted-foreground/50",
                )}
              />
              {!isLast ? <div className="my-1 w-px flex-1 bg-border" /> : null}
            </div>
            <div className={cn("pb-5", isLast && "pb-0")}>
              <p
                className={cn(
                  "text-sm font-medium",
                  step.state === "upcoming" && "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
              {step.state !== "upcoming" && step.date ? (
                <p className="text-xs text-muted-foreground">
                  {formatOrderDate(step.date)}
                </p>
              ) : null}
              {step.note ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {step.note}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
