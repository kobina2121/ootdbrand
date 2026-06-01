"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type OrderTableActionsProps = {
  reference: string;
  customerEmail: string;
  orderType: "store" | "custom";
};

export function OrderTableActions({ reference, customerEmail, orderType }: OrderTableActionsProps) {
  const endpoint =
    orderType === "custom"
      ? `/api/admin/custom-orders/${encodeURIComponent(reference)}`
      : `/api/admin/orders/${encodeURIComponent(reference)}`;

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      toast.success("Payment reference copied");
    } catch {
      toast.error("Could not copy reference");
    }
  };

  const updateDeliveryState = async (
    deliveryStatus: "Shipped" | "Delivered",
    adminUpdate: string,
    successMessage: string,
  ) => {
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryStatus,
          adminUpdate,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        toast.error(payload.message ?? "Could not update delivery status");
        return;
      }

      toast.success(successMessage);
      window.location.reload();
    } catch {
      toast.error("Could not update delivery status");
    }
  };

  const deleteOrder = async () => {
    const confirmed = window.confirm("Delete this order permanently?");
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        toast.error(payload.message ?? "Could not delete order");
        return;
      }

      toast.success("Order deleted");
      window.location.reload();
    } catch {
      toast.error("Could not delete order");
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button size="sm" variant="outline" onClick={copyReference}>
        Copy Ref
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => updateDeliveryState("Shipped", "Your order is being delivered.", "Marked as being delivered")}
      >
        Mark Delivering
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => updateDeliveryState("Delivered", "Your order has been delivered.", "Marked as delivered")}
      >
        Mark Delivered
      </Button>
      <a href={`mailto:${customerEmail}?subject=Order%20Update%20(${encodeURIComponent(reference)})`}>
        <Button size="sm" variant="outline">
          Contact
        </Button>
      </a>
      <Button size="sm" variant="destructive" onClick={deleteOrder}>
        Delete
      </Button>
    </div>
  );
}
