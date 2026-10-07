import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { act, renderHook } from "@testing-library/react";
import { CartProvider, useCart, type CartItem } from "@/context/cart-context";

type NewItem = Omit<CartItem, "quantity">;

const LAMP: NewItem = {
  id: "lamp",
  name: "Lamp",
  price: 1999,
  currency: "EUR",
  imageUrl: "https://example.com/lamp.png",
};

const CHAIR: NewItem = {
  id: "chair",
  name: "Chair",
  price: 4550,
  currency: "EUR",
  imageUrl: "https://example.com/chair.png",
};

const MUG_USD: NewItem = {
  id: "mug",
  name: "Mug",
  price: 800,
  currency: "USD",
  imageUrl: "https://example.com/mug.png",
};

function renderCart(userId?: string) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <CartProvider userId={userId}>{children}</CartProvider>
  );
  return renderHook(() => useCart(), { wrapper });
}

function storedCart(userId = "guest"): CartItem[] {
  return JSON.parse(localStorage.getItem(`cart_${userId}`) ?? "[]");
}

beforeEach(() => {
  localStorage.clear();
});

describe("useCart", () => {
  it("throws when used outside of CartProvider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useCart())).toThrow(
      "useCart must be used within a CartProvider",
    );
    spy.mockRestore();
  });

  it("starts empty", () => {
    const { result } = renderCart();
    expect(result.current.cart).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice).toBe(0);
    expect(result.current.currency).toBeNull();
    expect(result.current.isHydrated).toBe(true);
  });
});

describe("addToCart", () => {
  it("adds a new item with quantity 1 and saves it to localStorage", () => {
    const { result } = renderCart();

    let response;
    act(() => {
      response = result.current.addToCart(LAMP);
    });

    expect(response).toEqual({ ok: true });
    expect(result.current.cart).toEqual([{ ...LAMP, quantity: 1 }]);
    expect(storedCart()).toEqual([{ ...LAMP, quantity: 1 }]);
  });

  it("increases the quantity when the same item is added again", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addToCart(LAMP);
      result.current.addToCart(LAMP);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(2);
  });

  it("never goes above 20 of the same item", () => {
    const { result } = renderCart();

    act(() => {
      for (let i = 0; i < 25; i++) result.current.addToCart(LAMP);
    });

    expect(result.current.cart[0].quantity).toBe(20);
  });

  it("rejects an item in a different currency and keeps the cart unchanged", () => {
    const { result } = renderCart();

    let response;
    act(() => {
      result.current.addToCart(LAMP);
      response = result.current.addToCart(MUG_USD);
    });

    expect(response).toEqual({
      ok: false,
      reason: "Your cart uses EUR. Complete or clear it first.",
    });
    expect(result.current.cart.map((i) => i.id)).toEqual(["lamp"]);
  });

  it("accepts the other currency once the cart is cleared", () => {
    const { result } = renderCart();

    let response;
    act(() => {
      result.current.addToCart(LAMP);
      result.current.clearCart();
      response = result.current.addToCart(MUG_USD);
    });

    expect(response).toEqual({ ok: true });
    expect(result.current.currency).toBe("USD");
  });
});

describe("quantity changes", () => {
  it("increases the quantity up to the limit", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addToCart(LAMP);
      for (let i = 0; i < 30; i++) result.current.increaseQuantity("lamp");
    });

    expect(result.current.cart[0].quantity).toBe(20);
  });

  it("decreases the quantity but never below 1", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addToCart(LAMP);
      result.current.increaseQuantity("lamp");
    });
    expect(result.current.cart[0].quantity).toBe(2);

    act(() => {
      result.current.decreaseQuantity("lamp");
      result.current.decreaseQuantity("lamp");
    });
    expect(result.current.cart[0].quantity).toBe(1);
  });

  it("only changes the targeted item", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addToCart(LAMP);
      result.current.addToCart(CHAIR);
      result.current.increaseQuantity("chair");
    });

    expect(result.current.cart).toEqual([
      { ...LAMP, quantity: 1 },
      { ...CHAIR, quantity: 2 },
    ]);
  });

  it("ignores unknown ids", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addToCart(LAMP);
      result.current.increaseQuantity("missing");
      result.current.decreaseQuantity("missing");
      result.current.removeFromCart("missing");
    });

    expect(result.current.cart).toEqual([{ ...LAMP, quantity: 1 }]);
  });
});

describe("removeFromCart and clearCart", () => {
  it("removes a single item", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addToCart(LAMP);
      result.current.addToCart(CHAIR);
      result.current.removeFromCart("lamp");
    });

    expect(result.current.cart.map((i) => i.id)).toEqual(["chair"]);
  });

  it("empties the cart and localStorage", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addToCart(LAMP);
      result.current.clearCart();
    });

    expect(result.current.cart).toEqual([]);
    expect(storedCart()).toEqual([]);
  });
});

describe("totals", () => {
  it("sums quantities and prices in cents", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addToCart(LAMP);
      result.current.addToCart(LAMP);
      result.current.addToCart(CHAIR);
    });

    expect(result.current.totalItems).toBe(3);
    expect(result.current.totalPrice).toBe(8548);
    expect(result.current.currency).toBe("EUR");
  });
});

describe("storage", () => {
  it("keeps a separate cart for each user", () => {
    const guest = renderCart();
    act(() => {
      guest.result.current.addToCart(LAMP);
    });

    const user = renderCart("auth0|123");
    expect(user.result.current.cart).toEqual([]);

    act(() => {
      user.result.current.addToCart(CHAIR);
    });
    expect(storedCart("auth0|123").map((i) => i.id)).toEqual(["chair"]);
    expect(storedCart().map((i) => i.id)).toEqual(["lamp"]);
  });

  it("loads an existing cart from localStorage", () => {
    localStorage.setItem(
      "cart_guest",
      JSON.stringify([{ ...LAMP, quantity: 3 }]),
    );
    const { result } = renderCart();
    expect(result.current.totalItems).toBe(3);
  });

  it.each([
    ["invalid JSON", "{not json"],
    ["a non-array value", JSON.stringify({ id: "lamp" })],
  ])("falls back to an empty cart for %s", (_label, raw) => {
    localStorage.setItem("cart_guest", raw);
    const { result } = renderCart();
    expect(result.current.cart).toEqual([]);
  });

  it("updates when another tab changes the cart", () => {
    const { result } = renderCart();

    act(() => {
      localStorage.setItem(
        "cart_guest",
        JSON.stringify([{ ...CHAIR, quantity: 2 }]),
      );
      window.dispatchEvent(new StorageEvent("storage", { key: "cart_guest" }));
    });

    expect(result.current.totalItems).toBe(2);
  });

  it("is not hydrated during server rendering", () => {
    function Probe() {
      const { isHydrated, cart } = useCart();
      return <span>{`${isHydrated}:${cart.length}`}</span>;
    }
    localStorage.setItem(
      "cart_guest",
      JSON.stringify([{ ...LAMP, quantity: 1 }]),
    );

    const html = renderToString(
      <CartProvider>
        <Probe />
      </CartProvider>,
    );

    expect(html).toContain("false:0");
  });
});
