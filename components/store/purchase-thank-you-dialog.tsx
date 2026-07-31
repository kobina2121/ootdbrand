"use client";

import { useState } from "react";
import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type PurchaseThankYouDialogProps = {
  customerName: string;
  orderHref: string;
  status: "success" | "pending";
};

function formatCustomerName(name: string) {
  const trimmed = name.trim();
  return trimmed || "Customer";
}

export function PurchaseThankYouDialog({
  customerName,
  orderHref,
  status,
}: PurchaseThankYouDialogProps) {
  const [open, setOpen] = useState(true);
  const displayName = formatCustomerName(customerName);
  const description =
    status === "success"
      ? "Your order has been received and is being prepared. You can track updates from your orders page."
      : "Your order has been received, and we’re confirming your payment. We’ll update your order once it is confirmed.";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden rounded-[2rem] border border-black/10 bg-[#fffaf3] p-0 text-left shadow-2xl sm:max-w-lg">
        <div className="bg-[#1f1b18] px-6 py-5 text-white sm:px-8">
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[#d8c9b8]">theootd.brand</p>
          <div className="mt-5 inline-flex size-12 items-center justify-center rounded-full bg-white text-2xl text-[#1f1b18]">
            ✓
          </div>
        </div>
        <div className="space-y-5 px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
          <DialogHeader className="gap-3">
            <DialogTitle className="font-heading text-4xl leading-[0.95] text-[#1f1b18] sm:text-5xl">
              {displayName}, thank you for shopping with theootd.brand.
            </DialogTitle>
            <DialogDescription className="text-base leading-7 text-[#6d6660]">
              {description}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-[#6d6660]">
            <span className="font-medium text-[#1f1b18]">Order update:</span>{" "}
            {status === "success" ? "Payment confirmed." : "Payment confirmation in progress."}
          </div>
          <DialogFooter className="-mx-6 -mb-6 gap-3 rounded-b-[2rem] border-black/10 bg-[#f7f1e8] px-6 py-5 sm:-mx-8 sm:-mb-8 sm:px-8">
            <Link href="/products" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full rounded-full border-black/15 bg-white">
                Continue Shopping
              </Button>
            </Link>
            <Link href={orderHref} className="w-full sm:w-auto">
              <Button className="w-full rounded-full bg-[#1f1b18] text-white hover:bg-[#332c27]">
                View My Order
              </Button>
            </Link>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
