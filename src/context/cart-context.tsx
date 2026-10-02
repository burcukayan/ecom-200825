"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string;
  quantity: number;
};

type AddToCartResult = { ok: true } | { ok: false; reason: string };

type CartContextType = {
  cart: CartItem[];
  isHydrated: boolean;
  addToCart: (item: Omit<CartItem, "quantity">) => AddToCartResult;
  removeFromCart: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  currency: string | null;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_EVENT = "cart-change";
const MAX_QUANTITY = 20;

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CART_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CART_EVENT, callback);
  };
}

function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function CartProvider({
  children,
  userId = "guest",
}: {
  children: React.ReactNode;
  userId?: string;
}) {
  const storageKey = `cart_${userId}`;

  const raw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(storageKey) ?? "[]",
    () => null,
  );
  const isHydrated = raw !== null;
  const cart = useMemo(() => parseCart(raw), [raw]);

  const write = useCallback(
    (updater: (prev: CartItem[]) => CartItem[]) => {
      const next = updater(parseCart(localStorage.getItem(storageKey)));
      localStorage.setItem(storageKey, JSON.stringify(next));
      window.dispatchEvent(new Event(CART_EVENT));
    },
    [storageKey],
  );

  const addToCart = useCallback(
    (item: Omit<CartItem, "quantity">): AddToCartResult => {
      const current = parseCart(localStorage.getItem(storageKey));
      if (current.length > 0 && current[0].currency !== item.currency) {
        return {
          ok: false,
          reason: `Your cart uses ${current[0].currency}. Complete or clear it first.`,
        };
      }
      write((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (existing) {
          return prev.map((i) =>
            i.id === item.id
              ? { ...i, quantity: Math.min(i.quantity + 1, MAX_QUANTITY) }
              : i,
          );
        }
        return [...prev, { ...item, quantity: 1 }];
      });
      return { ok: true };
    },
    [storageKey, write],
  );

  const removeFromCart = useCallback(
    (id: string) => write((prev) => prev.filter((i) => i.id !== id)),
    [write],
  );

  const increaseQuantity = useCallback(
    (id: string) =>
      write((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, quantity: Math.min(i.quantity + 1, MAX_QUANTITY) }
            : i,
        ),
      ),
    [write],
  );

  const decreaseQuantity = useCallback(
    (id: string) =>
      write((prev) =>
        prev.map((i) =>
          i.id === id && i.quantity > 1
            ? { ...i, quantity: i.quantity - 1 }
            : i,
        ),
      ),
    [write],
  );

  const clearCart = useCallback(() => write(() => []), [write]);

  const totalItems = cart.reduce((t, i) => t + i.quantity, 0);
  const totalPrice = cart.reduce((t, i) => t + i.price * i.quantity, 0);
  const currency = cart[0]?.currency ?? null;

  return (
    <CartContext.Provider
      value={{
        cart,
        isHydrated,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        totalItems,
        totalPrice,
        currency,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined)
    throw new Error("useCart must be used within a CartProvider");
  return context;
}
