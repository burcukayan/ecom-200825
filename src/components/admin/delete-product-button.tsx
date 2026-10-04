"use client";

import { useState, useTransition } from "react";
import { deleteProductAction } from "@/app/admin/products/action";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type DeleteProductButtonProps = {
  productId: string;
  productName: string;
};

export function DeleteProductButton({
  productId,
  productName,
}: DeleteProductButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    // Silme sürerken dialog kapatılamasın
    if (isPending) return;
    setOpen(next);
    setError(null);
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (result.ok) {
        setOpen(false);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete product?</AlertDialogTitle>
          <AlertDialogDescription>
            &quot;{productName}&quot; will be removed from the store and
            archived in Stripe. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          {/* AlertDialogAction tıklanınca dialog'u hemen kapatır. İşlem bitene
              kadar açık kalsın diye normal Button kullanıyoruz. */}
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}