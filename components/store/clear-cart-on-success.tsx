"use client";

import { useEffect, useRef } from "react";

import { useCart } from "@/components/store/cart-provider";

export function ClearCartOnSuccess({ shouldClear = true }: { shouldClear?: boolean }) {
  const { clearCart, userRole } = useCart();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!shouldClear || hasRun.current || userRole === "admin") {
      return;
    }

    hasRun.current = true;
    void clearCart().catch(() => {
      hasRun.current = false;
    });
  }, [clearCart, shouldClear, userRole]);

  return null;
}
