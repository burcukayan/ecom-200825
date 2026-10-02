"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Currency, formatPrice } from "@/types/currency";

export default function CartPage() {
  const {
    cart,
    isHydrated,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    totalItems,
    totalPrice,
    currency,
  } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(({ id, quantity }) => ({ productId: id, quantity })),
        }),
      });

      if (response.status === 401) {
        window.location.href = "/auth/login?returnTo=/cart";
        return;
      }

      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Something went wrong with checkout.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-muted-foreground">
        Loading cart...
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="text-muted-foreground">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Button asChild>
          <Link href="/">Start shopping</Link>
        </Button>
      </div>
    );
  }

  const cartCurrency = (currency ?? Currency.EUR) as Currency;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">
        Shopping cart
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-lg border bg-card p-4"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between">
                  <h3 className="text-lg font-medium">{item.name}</h3>
                  <p className="font-semibold">
                    {formatPrice(
                      item.price * item.quantity,
                      item.currency as Currency,
                    )}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center rounded-md border">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none"
                      onClick={() => decreaseQuantity(item.id)}
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none"
                      onClick={() => increaseQuantity(item.id)}
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-24 rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-medium">Order summary</h2>
            <div className="mb-2 flex justify-between text-muted-foreground">
              <span>Items ({totalItems})</span>
              <span>{formatPrice(totalPrice, cartCurrency)}</span>
            </div>
            <div className="mb-6 mt-4 flex justify-between border-t pt-4 text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(totalPrice, cartCurrency)}</span>
            </div>

            {error ? (
              <p role="alert" className="mb-4 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button
              className="w-full py-6 text-base font-semibold"
              size="lg"
              onClick={handleCheckout}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Proceed to checkout"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
