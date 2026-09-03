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
import {
  updateProductAction,
  type UpdateProductState,
} from "@/app/admin/products/action";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export type Product = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  category: string;
  stock: number;
  isActive: boolean;
  imageUrls?: string[];
};

function fieldError(fieldErrors?: Record<string, string>, field?: string) {
  return field ? fieldErrors?.[field] : undefined;
}

export function EditProductForm({ product }: { product: Product }) {
  const [state, formAction, isPending] = useActionState<
    UpdateProductState | null,
    FormData
  >(updateProductAction, null);

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
      <input type="hidden" name="id" value={product.id} />
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
            <Select name="category" defaultValue={values.category} required>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORY_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Select name="currency" defaultValue={values.currency} required>
              <SelectTrigger id="currency" className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {EU_CURRENCY_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        <div className="flex items-center gap-3">
          <Checkbox
            id="isActive"
            name="isActive"
            defaultChecked={values.isActive}
          />
          <Label
            htmlFor="isActive"
            className="text-sm font-normal cursor-pointer"
          >
            Product is active and visible in the store
          </Label>
        </div>
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
