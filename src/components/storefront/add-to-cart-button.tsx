"use client";

import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";

type AddToCartButtonProps = {
  product: {
    id: string;
    name: string;
    price: number;
    currency: string;
    imageUrl: string;
  };
  disabled?: boolean;
};

export function AddToCartButton({ product, disabled }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = () => {
    const result = addToCart(product);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setError(null);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={handleAddToCart} disabled={disabled || isAdded}>
        {disabled ? "Out of stock" : isAdded ? "Added to cart" : "Add to cart"}
      </Button>
      {error ? (
        <p className="max-w-48 text-right text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
