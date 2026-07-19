"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { calculateCartTotals, type CartItem, type CartTotals } from "@/lib/products";

type AddPayload = Omit<CartItem, "quantity"> & { quantity?: number };

type CartDiscountState = {
  requestedCode: string | null;
  appliedCode: string | null;
  amount: number;
  message: string | null;
};

type CartPricingState = {
  totals: CartTotals;
  discount: CartDiscountState;
};

type CartState = {
  items: CartItem[];
  discountCode: string;
  pricing: CartPricingState;
};

type CartContextValue = {
  userRole: "customer" | "admin" | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  discountedSubtotal: number;
  discountCode: string;
  appliedDiscountCode: string | null;
  discountMessage: string | null;
  shipping: number;
  transactionFee: number;
  total: number;
  addItem: (payload: AddPayload) => Promise<void>;
  removeItem: (sku: string) => Promise<void>;
  updateQuantity: (sku: string, quantity: number) => Promise<void>;
  applyDiscountCode: (code: string) => Promise<void>;
  clearDiscountCode: () => Promise<void>;
  clearCart: () => Promise<void>;
  syncCart: () => Promise<void>;
};

const LEGACY_CART_STORAGE_KEY = "threadline.cart.v1";
const CART_STORAGE_KEY_PREFIX = "threadline.cart.v2";

const CartContext = createContext<CartContextValue | null>(null);

function createEmptyDiscount(requestedCode?: string | null): CartDiscountState {
  return {
    requestedCode: requestedCode ?? null,
    appliedCode: null,
    amount: 0,
    message: null,
  };
}

export function getCartStorageKey(userId?: string | null) {
  return `${CART_STORAGE_KEY_PREFIX}.${userId ? `user.${userId}` : "guest"}`;
}

function readStoredCartState(storageKey: string): Pick<CartState, "items" | "discountCode"> {
  if (typeof window === "undefined") {
    return {
      items: [],
      discountCode: "",
    };
  }

  const stored = localStorage.getItem(storageKey) ?? (!storageKey.endsWith(".guest") ? null : localStorage.getItem(LEGACY_CART_STORAGE_KEY));
  if (!stored) {
    return {
      items: [],
      discountCode: "",
    };
  }

  try {
    const parsed = JSON.parse(stored) as CartItem[] | { items?: CartItem[]; discountCode?: string };

    if (Array.isArray(parsed)) {
      return {
        items: parsed,
        discountCode: "",
      };
    }

    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      discountCode: typeof parsed.discountCode === "string" ? parsed.discountCode : "",
    };
  } catch {
    localStorage.removeItem(storageKey);
    return {
      items: [],
      discountCode: "",
    };
  }
}

function createInitialCartState(storageKey: string): CartState {
  const stored = readStoredCartState(storageKey);

  return {
    items: stored.items,
    discountCode: stored.discountCode,
    pricing: {
      totals: calculateCartTotals(stored.items),
      discount: createEmptyDiscount(stored.discountCode || null),
    },
  };
}

async function syncCartPayload(items: CartItem[], discountCode?: string) {
  try {
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items, discountCode }),
    });

    const json = (await response.json()) as {
      ok: boolean;
      message: string;
      data?: {
        totals: CartTotals;
        discount: CartDiscountState;
      };
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
      totals: json.data?.totals ?? calculateCartTotals(items),
      discount: json.data?.discount ?? createEmptyDiscount(discountCode ?? null),
    };
  } catch {
    return {
      ok: false as const,
      message: "Could not sync cart.",
    };
  }
}

function getUnavailableVariantSku(message: string) {
  const match = message.match(/^Variant not found:\s*(.+)$/i);
  return match?.[1]?.trim() || null;
}

async function syncCartPayloadWithRecovery(items: CartItem[], discountCode?: string) {
  const result = await syncCartPayload(items, discountCode);

  if (result.ok) {
    return {
      ...result,
      items,
      removedSku: null,
    };
  }

  const unavailableSku = getUnavailableVariantSku(result.message);
  if (!unavailableSku) {
    return {
      ...result,
      items,
      removedSku: null,
    };
  }

  const prunedItems = items.filter((item) => item.sku !== unavailableSku);
  if (prunedItems.length === items.length) {
    return {
      ...result,
      items,
      removedSku: null,
    };
  }

  const retryResult = await syncCartPayload(prunedItems, discountCode);
  if (!retryResult.ok) {
    return {
      ...retryResult,
      items: prunedItems,
      removedSku: unavailableSku,
    };
  }

  return {
    ...retryResult,
    items: prunedItems,
    removedSku: unavailableSku,
  };
}

export function CartProvider({
  children,
  userId = null,
  userRole = null,
}: {
  children: React.ReactNode;
  userId?: string | null;
  userRole?: "customer" | "admin" | null;
}) {
  const storageKey = useMemo(() => getCartStorageKey(userId), [userId]);
  const [cartState, setCartState] = useState<CartState>(() => createInitialCartState(storageKey));

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        items: cartState.items,
        discountCode: cartState.discountCode || undefined,
      }),
    );
  }, [cartState.discountCode, cartState.items, storageKey]);

  const syncCart = useCallback(async () => {
    const result = await syncCartPayloadWithRecovery(cartState.items, cartState.discountCode || undefined);

    if (!result.ok) {
      throw new Error(result.message);
    }

    setCartState((prev) => ({
      ...prev,
      items: result.items,
      discountCode: result.discount.requestedCode ?? "",
      pricing: {
        totals: result.totals,
        discount: result.discount,
      },
    }));
  }, [cartState.discountCode, cartState.items]);

  const addItem = useCallback(async (payload: AddPayload) => {
    let previousState: CartState | null = null;
    let nextItems: CartItem[] = [];
    let nextDiscountCode = "";

    setCartState((prev) => {
      previousState = prev;
      nextDiscountCode = prev.discountCode;
      const existing = prev.items.find((item) => item.sku === payload.sku);

      if (existing) {
        nextItems = prev.items.map((item) =>
          item.sku === payload.sku
            ? {
                ...item,
                quantity: item.quantity + (payload.quantity ?? 1),
              }
            : item,
        );

        return {
          ...prev,
          items: nextItems,
        };
      }

      nextItems = [...prev.items, { ...payload, quantity: payload.quantity ?? 1 }];
      return {
        ...prev,
        items: nextItems,
      };
    });

    const result = await syncCartPayloadWithRecovery(nextItems, nextDiscountCode || undefined);

    if (!result.ok) {
      if (previousState) {
        setCartState(previousState);
      }
      throw new Error(result.message);
    }

    if (result.removedSku === payload.sku) {
      setCartState({
        items: result.items,
        discountCode: result.discount.requestedCode ?? "",
        pricing: {
          totals: result.totals,
          discount: result.discount,
        },
      });
      throw new Error("This product option is no longer available.");
    }

    setCartState({
      items: result.items,
      discountCode: result.discount.requestedCode ?? "",
      pricing: {
        totals: result.totals,
        discount: result.discount,
      },
    });
  }, []);

  const updateQuantity = useCallback(async (sku: string, quantity: number) => {
    const safeQuantity = Math.max(1, quantity);
    let previousState: CartState | null = null;
    let nextItems: CartItem[] = [];
    let nextDiscountCode = "";

    setCartState((prev) => {
      previousState = prev;
      nextDiscountCode = prev.discountCode;
      nextItems = prev.items.map((item) => (item.sku === sku ? { ...item, quantity: safeQuantity } : item));
      return {
        ...prev,
        items: nextItems,
      };
    });

    const result = await syncCartPayloadWithRecovery(nextItems, nextDiscountCode || undefined);

    if (!result.ok) {
      if (previousState) {
        setCartState(previousState);
      }
      throw new Error(result.message);
    }

    setCartState({
      items: result.items,
      discountCode: result.discount.requestedCode ?? "",
      pricing: {
        totals: result.totals,
        discount: result.discount,
      },
    });
  }, []);

  const removeItem = useCallback(async (sku: string) => {
    let previousState: CartState | null = null;
    let nextItems: CartItem[] = [];
    let nextDiscountCode = "";

    setCartState((prev) => {
      previousState = prev;
      nextDiscountCode = prev.discountCode;
      nextItems = prev.items.filter((item) => item.sku !== sku);
      return {
        ...prev,
        items: nextItems,
      };
    });

    const result = await syncCartPayloadWithRecovery(nextItems, nextDiscountCode || undefined);

    if (!result.ok) {
      if (previousState) {
        setCartState(previousState);
      }
      throw new Error(result.message);
    }

    setCartState({
      items: result.items,
      discountCode: result.discount.requestedCode ?? "",
      pricing: {
        totals: result.totals,
        discount: result.discount,
      },
    });
  }, []);

  const clearCart = useCallback(async () => {
    let previousState: CartState | null = null;

    setCartState((prev) => {
      previousState = prev;
      return {
        ...prev,
        items: [],
        discountCode: "",
        pricing: {
          totals: calculateCartTotals([]),
          discount: createEmptyDiscount(),
        },
      };
    });

    const result = await syncCartPayload([]);

    if (!result.ok) {
      if (previousState) {
        setCartState(previousState);
      }
      throw new Error(result.message);
    }
  }, []);

  const applyDiscountCode = useCallback(
    async (code: string) => {
      const nextDiscountCode = code.trim().toUpperCase();
      const previousState = cartState;

      setCartState({
        ...previousState,
        discountCode: nextDiscountCode,
      });

      const items = previousState.items;
    const result = await syncCartPayloadWithRecovery(items, nextDiscountCode || undefined);

    if (!result.ok) {
      setCartState(previousState);
        throw new Error(result.message);
      }

    setCartState({
      items: result.items,
      discountCode: result.discount.requestedCode ?? "",
      pricing: {
        totals: result.totals,
          discount: result.discount,
        },
      });
    },
    [cartState],
  );

  const clearDiscountCode = useCallback(async () => {
    const previousState = cartState;

    setCartState({
      ...previousState,
      discountCode: "",
    });

    const items = previousState.items;
    const result = await syncCartPayloadWithRecovery(items);

    if (!result.ok) {
      setCartState(previousState);
      throw new Error(result.message);
    }

    setCartState({
      items: result.items,
      discountCode: "",
      pricing: {
        totals: result.totals,
        discount: result.discount,
      },
    });
  }, [cartState]);

  const effectiveItems = useMemo(() => (userRole === "admin" ? [] : cartState.items), [cartState.items, userRole]);
  const effectiveTotals = useMemo(
    () => (userRole === "admin" ? calculateCartTotals([]) : cartState.pricing.totals),
    [cartState.pricing.totals, userRole],
  );
  const effectiveDiscount = useMemo(
    () => (userRole === "admin" ? createEmptyDiscount() : cartState.pricing.discount),
    [cartState.pricing.discount, userRole],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      userRole,
      items: effectiveItems,
      itemCount: effectiveItems.reduce((count, item) => count + item.quantity, 0),
      subtotal: effectiveTotals.subtotal,
      discount: effectiveTotals.discount,
      discountedSubtotal: effectiveTotals.discountedSubtotal,
      discountCode: userRole === "admin" ? "" : cartState.discountCode,
      appliedDiscountCode: effectiveDiscount.appliedCode,
      discountMessage: effectiveDiscount.message,
      shipping: effectiveTotals.shipping,
      transactionFee: effectiveTotals.transactionFee,
      total: effectiveTotals.total,
      addItem,
      removeItem,
      updateQuantity,
      applyDiscountCode,
      clearDiscountCode,
      clearCart,
      syncCart,
    }),
    [
      addItem,
      applyDiscountCode,
      cartState.discountCode,
      clearCart,
      clearDiscountCode,
      effectiveDiscount.appliedCode,
      effectiveDiscount.message,
      effectiveItems,
      effectiveTotals.discount,
      effectiveTotals.discountedSubtotal,
      effectiveTotals.shipping,
      effectiveTotals.subtotal,
      effectiveTotals.transactionFee,
      effectiveTotals.total,
      removeItem,
      syncCart,
      updateQuantity,
      userRole,
    ],
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
