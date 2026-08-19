"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react"; 
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";

export function CartButton() {
  const { totalItems } = useCart();

  return (
    <Link href="/cart">
      <Button variant="outline" size="icon" className="relative">
        <ShoppingCart className="h-5 w-5" />
        
        {totalItems > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
            {totalItems}
          </span>
        )}
      </Button>
    </Link>
  );
}