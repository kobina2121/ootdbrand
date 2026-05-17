"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ProductTableActionsProps = {
  productId: string;
  productName: string;
};

export function ProductTableActions({ productId, productName }: ProductTableActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      const json = (await response.json()) as { ok: boolean; message: string };

      if (!response.ok || !json.ok) {
        toast.error(json.message || "Could not delete product");
        return;
      }

      toast.success(`Deleted "${productName}"`);
      router.refresh();
    } catch {
      toast.error("Could not delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-x-2 text-right">
      <Link href={`/admin/products/${productId}/edit`}>
        <Button size="sm" variant="outline">
          Edit
        </Button>
      </Link>

      <AlertDialog>
        <AlertDialogTrigger className="inline-flex h-7 items-center rounded-md bg-destructive px-2.5 text-[0.8rem] text-destructive-foreground">
          Delete
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Product references in past orders will remain as snapshots.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
