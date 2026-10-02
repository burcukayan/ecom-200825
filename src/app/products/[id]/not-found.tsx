import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Product not found</h1>
      <p className="text-sm text-muted-foreground">
        This product does not exist or is no longer available.
      </p>
      <Button asChild>
        <Link href="/">Back to products</Link>
      </Button>
    </main>
  );
}
