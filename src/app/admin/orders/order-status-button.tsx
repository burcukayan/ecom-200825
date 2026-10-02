"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CARRIERS } from "@/lib/carriers";
import type { OrderStatus } from "@/lib/orders";
import {
  cancelOrderAction,
  updateOrderStatusAction,
  type UpdateOrderStatusState,
} from "./action";

export function OrderStatusButton({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const [statusState, statusAction, isStatusPending] = useActionState<
    UpdateOrderStatusState,
    FormData
  >(updateOrderStatusAction, null);
  const [cancelState, cancelAction, isCancelPending] = useActionState<
    UpdateOrderStatusState,
    FormData
  >(cancelOrderAction, null);
  const [isShipFormOpen, setIsShipFormOpen] = useState(false);

  const canShip = currentStatus === "PAID";
  const canComplete = currentStatus === "SHIPPING";
  const canCancel = currentStatus === "PAID";
  const isPending = isStatusPending || isCancelPending;
  const error = statusState?.error ?? cancelState?.error;

  if (!canShip && !canComplete && !canCancel) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  if (canShip && isShipFormOpen) {
    return (
      <form
        action={statusAction}
        className="ml-auto flex w-56 flex-col gap-2 text-left"
      >
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="status" value="SHIPPING" />

        <select
          name="carrier"
          required
          defaultValue=""
          aria-label="Carrier"
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <option value="" disabled>
            Select carrier
          </option>
          {CARRIERS.map((carrier) => (
            <option key={carrier} value={carrier}>
              {carrier}
            </option>
          ))}
        </select>

        <Input
          name="trackingNumber"
          placeholder="Tracking number"
          aria-label="Tracking number"
          required
          minLength={5}
          maxLength={40}
          pattern="[A-Za-z0-9\-]+"
          title="Letters, numbers and dashes only"
          autoComplete="off"
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={isStatusPending}
            onClick={() => setIsShipFormOpen(false)}
          >
            Back
          </Button>
          <Button type="submit" size="sm" disabled={isStatusPending}>
            {isStatusPending ? "Saving..." : "Confirm shipment"}
          </Button>
        </div>
        {statusState?.error ? (
          <p className="text-xs text-destructive">{statusState.error}</p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex justify-end gap-2">
        {canShip ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => setIsShipFormOpen(true)}
          >
            Mark as shipped
          </Button>
        ) : null}

        {canComplete ? (
          <form action={statusAction}>
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="status" value="COMPLETED" />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={isPending}
            >
              {isStatusPending ? "Saving..." : "Mark as completed"}
            </Button>
          </form>
        ) : null}

        {canCancel ? (
          <form
            action={cancelAction}
            onSubmit={(event) => {
              if (
                !window.confirm(
                  "Cancel this order and refund the full amount to the customer?",
                )
              ) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="orderId" value={orderId} />
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              disabled={isPending}
            >
              {isCancelPending ? "Refunding..." : "Cancel & refund"}
            </Button>
          </form>
        ) : null}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
