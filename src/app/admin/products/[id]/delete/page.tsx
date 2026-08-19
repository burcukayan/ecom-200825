import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProductById } from "@/lib/products";
import { deleteProduct } from "./action";

type DeleteProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DeleteProductPage({
  params,
}: DeleteProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const deleteProductAction = deleteProduct.bind(null, id);

  return (
    <main className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Delete product
        </h1>
        <p className="text-sm text-muted-foreground">{product.name}</p>
      </div>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle>Confirm deletion</CardTitle>
          <CardDescription>
            Are you sure you want to delete this product? This will remove it
            from the database and automatically archive the product and price in
            Stripe. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <form action={deleteProductAction}>
            <Button variant="destructive" type="submit">
              Delete product
            </Button>
          </form>

          <Button asChild variant="outline">
            <Link href="/admin/products">Cancel</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
