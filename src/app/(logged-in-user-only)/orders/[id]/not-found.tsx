import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OrderNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Order not found</h1>
      <p className="text-sm text-muted-foreground">
        This order does not exist or does not belong to your account.
      </p>
      <Button asChild>
        <Link href="/orders">Back to my orders</Link>
      </Button>
    </main>
  );
}
