import { notFound } from "next/navigation";
import { getProductById } from "@/lib/products";
import { EditProductForm } from "./edit-product-form";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;

  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Edit product
        </h1>
        <p className="text-sm text-muted-foreground">
          Update information for:{" "}
          <span className="font-medium text-foreground">{product.name}</span>
        </p>
        <p className="text-xs text-muted-foreground/70">
          Product ID: {product.id}
        </p>
      </div>

      <EditProductForm product={product} />
    </main>
  );
}
