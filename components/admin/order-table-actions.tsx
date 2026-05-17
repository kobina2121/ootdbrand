"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type OrderTableActionsProps = {
  reference: string;
  customerEmail: string;
};

export function OrderTableActions({ reference, customerEmail }: OrderTableActionsProps) {
  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      toast.success("Payment reference copied");
    } catch {
      toast.error("Could not copy reference");
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button size="sm" variant="outline" onClick={copyReference}>
        Copy Ref
      </Button>
      <a href={`mailto:${customerEmail}?subject=Order%20Update%20(${encodeURIComponent(reference)})`}>
        <Button size="sm" variant="outline">
          Contact
        </Button>
      </a>
    </div>
  );
}
