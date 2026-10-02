import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid product id"),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1, "Cart is empty")
    .max(50),
});

const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in to checkout." }, { status: 401 });
  }

  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid cart" }, { status: 400 });
  }
  const { items } = parsed.data;

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, isActive: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  const lineItems: { price: string; quantity: number }[] = [];
  const currencies = new Set<string>();

  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product || !product.stripePriceId) {
      return NextResponse.json({ error: "A product in your cart is no longer available." }, { status: 409 });
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Only ${product.stock} left in stock for "${product.name}".` },
        { status: 409 },
      );
    }
    currencies.add(product.currency);
    lineItems.push({ price: product.stripePriceId, quantity: item.quantity });
  }

  if (currencies.size > 1) {
    return NextResponse.json({ error: "All items must use the same currency." }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      client_reference_id: user.sub,
      customer_email: user.email,
      shipping_address_collection: { allowed_countries: ["TR", "DE", "NL", "FR", "GB", "US"] },
      success_url: `${APP_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_BASE_URL}/cart`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }
}
