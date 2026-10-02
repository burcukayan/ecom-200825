import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth0";
import { stripe } from "@/lib/stripe";
import { Currency, formatPrice } from "@/types/currency";
import { ClearCart } from "./clear-cart";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export const metadata = { title: "Order confirmed" };

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const user = await requireUser();
  const { session_id } = await searchParams;

  if (!session_id?.startsWith("cs_")) redirect("/");

  const session = await stripe.checkout.sessions.retrieve(session_id).catch(() => null);

  if (!session || session.client_reference_id !== user.sub) redirect("/");

  const isPaid = session.payment_status === "paid";

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      {isPaid ? <ClearCart /> : null}
      <h1 className="text-2xl font-semibold text-foreground">
        {isPaid ? "Thank you for your order" : "Payment is being processed"}
      </h1>
      {session.amount_total != null && session.currency ? (
        <p className="text-muted-foreground">
          Total:{" "}
          <span className="font-medium text-foreground">
            {formatPrice(session.amount_total, session.currency.toUpperCase() as Currency)}
          </span>
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        A confirmation will be sent to {session.customer_details?.email ?? user.email}.
      </p>
      <Button asChild>
        <Link href="/">Continue shopping</Link>
      </Button>
    </main>
  );
}
