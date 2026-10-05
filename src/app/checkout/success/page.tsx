import Link from "next/link";
import { Button } from "@/components/ui/button";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  await searchParams;

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Thank you for your order</h1>
      <p className="text-muted-foreground">
        Your payment was successful.
      </p>
      <Button asChild>
        <Link href="/">Continue shopping</Link>
      </Button>
    </main>
  );
}