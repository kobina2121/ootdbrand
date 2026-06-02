"use client";

import { useEffect, useRef } from "react";

import { useCart } from "@/components/store/cart-provider";

export function ClearCartOnSuccess() {
  const { clearCart, itemCount, userRole } = useCart();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current || userRole === "admin" || itemCount === 0) {
      return;
    }

    hasRun.current = true;
    void clearCart().catch(() => {
      hasRun.current = false;
    });
  }, [clearCart, itemCount, userRole]);

  return null;
}
