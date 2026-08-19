"use client";

import { useCart } from "@/context/cart-context";
import { useState } from "react";
import { Button } from "@/components/ui/button"; 

type AddToCartButtonProps = {
  product: {
    id: string;
    name: string;
    price: number;
    currency: string;
    imageUrl: string;
    stripePriceId: string;
  };
};

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    setIsAdded(true);
    
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAdded}
      className={`w-full ${isAdded ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
    >
      {isAdded ? "✓ Added to Cart" : "Add to Cart"}
    </Button>
  );
}