import Link from "next/link";

import { Button } from "@/components/ui/button";

type CreateProductSuccessProps = {
  productId: string;
};

export function CreateProductSuccess({ productId }: CreateProductSuccessProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Product created</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The product was saved to MongoDB and images were uploaded to Vercel Blob.
      </p>
      <p className="mt-4 text-sm">
        Product ID:{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{productId}</code>
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/admin/products/new">Create another product</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/products">View all products</Link>
        </Button>
      </div>
    </div>
  );
}