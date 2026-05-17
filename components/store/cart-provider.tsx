"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { calculateCartTotals, type CartItem } from "@/lib/products";

type AddPayload = Omit<CartItem, "quantity"> & { quantity?: number };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  addItem: (payload: AddPayload) => Promise<void>;
  removeItem: (sku: string) => Promise<void>;
  updateQuantity: (sku: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncCart: () => Promise<void>;
};

const CART_STORAGE_KEY = "threadline.cart.v1";

const CartContext = createContext<CartContextValue | null>(null);

async function syncCartPayload(items: CartItem[]) {
  try {
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    });

    const json = (await response.json()) as {
      ok: boolean;
      message: string;
    };

    if (!response.ok || !json.ok) {
      return {
        ok: false as const,
        message: json.message || "Could not sync cart.",
      };
    }

    return {
      ok: true as const,
      message: json.message,
    };
  } catch {
    return {
      ok: false as const,
      message: "Could not sync cart.",
    };
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    try {
      return JSON.parse(stored) as CartItem[];
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const syncCart = useCallback(async () => {
    const result = await syncCartPayload(items);

    if (!result.ok) {
      throw new Error(result.message);
    }
  }, [items]);

  const addItem = useCallback(async (payload: AddPayload) => {
    let previousItems: CartItem[] = [];
    let nextItems: CartItem[] = [];

    setItems((prev) => {
      previousItems = prev;
      const existing = prev.find((item) => item.sku === payload.sku);

      if (existing) {
        nextItems = prev.map((item) =>
          item.sku === payload.sku
            ? {
                ...item,
                quantity: item.quantity + (payload.quantity ?? 1),
              }
            : item,
        );

        return nextItems;
      }

      nextItems = [...prev, { ...payload, quantity: payload.quantity ?? 1 }];
      return nextItems;
    });

    const result = await syncCartPayload(nextItems);

    if (!result.ok) {
      setItems(previousItems);
      throw new Error(result.message);
    }
  }, []);

  const updateQuantity = useCallback(async (sku: string, quantity: number) => {
    const safeQuantity = Math.max(1, quantity);
    let previousItems: CartItem[] = [];
    let nextItems: CartItem[] = [];

    setItems((prev) => {
      previousItems = prev;
      nextItems = prev.map((item) => (item.sku === sku ? { ...item, quantity: safeQuantity } : item));
      return nextItems;
    });

    const result = await syncCartPayload(nextItems);

    if (!result.ok) {
      setItems(previousItems);
      throw new Error(result.message);
    }
  }, []);

  const removeItem = useCallback(async (sku: string) => {
    let previousItems: CartItem[] = [];
    let nextItems: CartItem[] = [];

    setItems((prev) => {
      previousItems = prev;
      nextItems = prev.filter((item) => item.sku !== sku);
      return nextItems;
    });

    const result = await syncCartPayload(nextItems);

    if (!result.ok) {
      setItems(previousItems);
      throw new Error(result.message);
    }
  }, []);

  const clearCart = useCallback(async () => {
    let previousItems: CartItem[] = [];

    setItems((prev) => {
      previousItems = prev;
      return [];
    });

    const result = await syncCartPayload([]);

    if (!result.ok) {
      setItems(previousItems);
      throw new Error(result.message);
    }
  }, []);

  const totals = useMemo(() => calculateCartTotals(items), [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      total: totals.total,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      syncCart,
    }),
    [addItem, clearCart, items, removeItem, syncCart, totals.shipping, totals.subtotal, totals.total, updateQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
