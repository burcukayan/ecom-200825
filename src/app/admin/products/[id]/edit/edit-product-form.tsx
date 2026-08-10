"use client";

import { useActionState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ACCEPTED_IMAGE_ACCEPT_ATTR, MAX_IMAGE_MB } from "@/lib/product-images";
import { EU_CURRENCY_OPTIONS } from "@/types/currency";
import { PRODUCT_CATEGORY_OPTIONS } from "@/types/product";
import { updateProductAction, type UpdateProductState } from "@/app/admin/products/new/action";

function fieldError(fieldErrors: any, field: string) {
  return fieldErrors?.[field];
}

export function EditProductForm({ product }: { product: any }) {
  const updateProductWithId = updateProductAction.bind(null, product.id);

  const [state, formAction, isPending] = useActionState<
    UpdateProductState | null,
    FormData
  >(updateProductWithId, null);

  const values = state?.values ?? {
    name: product.name,
    description: product.description,
    price: (product.priceCents / 100).toString(),
    currency: product.currency,
    category: product.category,
    stock: product.stock.toString(),
    isActive: product.isActive,
  };

  const fieldErrors = state?.fieldErrors;

  return (
    <form action={formAction} className="space-y-8">
      {state?.message ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </div>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Basic details
          </h2>
        </div>

        <div className="grid gap-4">
          <FormField
            id="name"
            label="Name"
            error={fieldError(fieldErrors, "name")}
          >
            <Input id="name" name="name" defaultValue={values.name} required />
          </FormField>

          <FormField
            id="description"
            label="Description"
            error={fieldError(fieldErrors, "description")}
          >
            <Textarea
              id="description"
              name="description"
              defaultValue={values.description}
              required
            />
          </FormField>

          <FormField
            id="category"
            label="Category"
            error={fieldError(fieldErrors, "category")}
          >
            <select
              id="category"
              name="category"
              defaultValue={values.category}
              className={cn(
                "h-9 w-full rounded-lg border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                fieldError(fieldErrors, "category") && "border-destructive",
              )}
              required
            >
              {PRODUCT_CATEGORY_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Pricing & inventory
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            id="price"
            label="Price"
            error={fieldError(fieldErrors, "price")}
          >
            <Input
              id="price"
              name="price"
              type="text"
              inputMode="decimal"
              defaultValue={values.price}
              required
            />
          </FormField>

          <FormField
            id="currency"
            label="Currency"
            error={fieldError(fieldErrors, "currency")}
          >
            <select
              id="currency"
              name="currency"
              defaultValue={values.currency}
              className="h-9 w-full rounded-lg border border-input bg-input/30 px-3 text-sm"
              required
            >
              {EU_CURRENCY_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            id="stock"
            label="Stock"
            error={fieldError(fieldErrors, "stock")}
          >
            <Input
              id="stock"
              name="stock"
              type="number"
              min={0}
              step={1}
              defaultValue={values.stock}
              required
            />
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Images</h2>
          <p className="text-sm text-muted-foreground">
            Current images are displayed below. Uploading new images will
            replace the existing ones.
          </p>
        </div>

        {product.imageUrls && product.imageUrls.length > 0 && (
          <div className="flex gap-4 mb-4">
            {product.imageUrls.map((url: string, index: number) => (
              <div
                key={index}
                className="relative size-24 overflow-hidden rounded-md border border-border"
              >
                <Image
                  src={url}
                  alt="Product image"
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <FormField
          id="images"
          label="Upload New Images (Optional)"
          error={fieldError(fieldErrors, "images")}
        >
          <Input
            id="images"
            name="images"
            type="file"
            accept={ACCEPTED_IMAGE_ACCEPT_ATTR}
            multiple
          />
        </FormField>
      </section>

      <section className="space-y-4">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={values.isActive}
            className="size-4 rounded border border-input accent-primary"
          />
          <span>Product is active and visible in the store</span>
        </label>
      </section>

      <div className="flex items-center gap-3 border-t border-border pt-6">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving changes..." : "Save changes"}
        </Button>
        <Button asChild variant="outline" disabled={isPending}>
          <Link href="/admin/products">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

function FormField({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
