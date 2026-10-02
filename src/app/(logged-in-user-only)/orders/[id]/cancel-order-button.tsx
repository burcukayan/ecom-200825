"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { cancelMyOrderAction, type CancelMyOrderState } from "./action";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [state, action, isPending] = useActionState<
    CancelMyOrderState,
    FormData
  >(cancelMyOrderAction, null);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Cancel this order? The full amount will be refunded to your original payment method.",
          )
        ) {
          event.preventDefault();
        }
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <Button
        type="submit"
        variant="destructive"
        disabled={isPending}
        className="w-full"
      >
        {isPending ? "Cancelling..." : "Cancel order"}
      </Button>
      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        You can cancel until your order ships.
      </p>
    </form>
  );
}
