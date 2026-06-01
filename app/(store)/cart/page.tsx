"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { useCart } from "@/components/store/cart-provider";
import { ProductGrid } from "@/components/store/product-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPriceNgn } from "@/lib/products";

type SuggestedProduct = {
  slug: string;
  name: string;
  category: string;
  image: string;
  price: number;
  sizes: string[];
};

export default function CartPage() {
  const { items, subtotal, total, updateQuantity, removeItem, clearCart, syncCart, userRole } = useCart();
  const [pendingSku, setPendingSku] = useState<string | null>(null);
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void syncCart().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Could not sync cart.";
      toast.error(message);
    });
  }, [isHydrated, syncCart]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const controller = new AbortController();
    const loadSuggestions = async () => {
      try {
        setIsLoadingSuggestions(true);

        const exclude = [...new Set(items.map((item) => item.slug))].join(",");
        const query = new URLSearchParams({ limit: "4" });
        if (exclude) {
          query.set("exclude", exclude);
        }

        const response = await fetch(`/api/products?${query.toString()}`, {
          signal: controller.signal,
        });

        const json = (await response.json()) as {
          ok: boolean;
          data?: { products?: SuggestedProduct[] };
        };

        if (!response.ok || !json.ok) {
          return;
        }

        setSuggestedProducts(json.data?.products ?? []);
      } catch {
        // No-op: suggestions are optional.
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    void loadSuggestions();

    return () => controller.abort();
  }, [isHydrated, items]);

  if (!isHydrated) {
    return (
      <Card className="mx-auto w-full max-w-2xl rounded-3xl border-black/10 bg-white/90 text-center shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-5xl leading-none">Loading cart...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Preparing your cart details.</p>
        </CardContent>
      </Card>
    );
  }

  if (userRole === "admin") {
    return (
      <Card className="mx-auto w-full max-w-2xl rounded-3xl border-black/10 bg-white/90 text-center shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-5xl leading-none">Admin Shopping Disabled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Admin accounts cannot place store orders or manage cart items.</p>
          <Link href="/admin/products">
            <Button className="rounded-full">Go to Admin Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="mx-auto w-full max-w-2xl rounded-3xl border-black/10 bg-white/90 text-center shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-5xl leading-none">Your cart is empty</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Add products to your cart to continue checkout.</p>
          <Link href="/products">
            <Button className="rounded-full">Browse Products</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleQuantityUpdate = async (sku: string, quantity: number) => {
    setPendingSku(sku);
    try {
      await updateQuantity(sku, quantity);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update quantity.";
      toast.error(message);
    }
    setPendingSku(null);
  };

  const handleRemoveItem = async (sku: string) => {
    try {
      await removeItem(sku);
      toast.success("Item removed from cart");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not remove item.";
      toast.error(message);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      toast.success("Cart cleared");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not clear cart.";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-black/10 bg-[linear-gradient(135deg,#f7f5f1_0%,#f1ede6_100%)] p-5 shadow-sm sm:p-7">
        <h1 className="font-heading text-5xl leading-none text-[#1f1b18] sm:text-6xl">Shopping Cart</h1>
        <p className="section-subtitle mt-2">Review your picks and continue to secure checkout.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="rounded-2xl border-black/10 bg-white/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Cart Items</CardTitle>
            <Button variant="ghost" className="rounded-full" onClick={() => void handleClearCart()}>
              Clear cart
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => (
              <div key={item.sku} className="flex flex-col gap-3 rounded-xl border border-black/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="h-16 w-16 rounded-md object-cover" />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.size} · {item.color}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatPriceNgn(item.unitPrice)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={item.quantity}
                    type="number"
                    min={1}
                    className="h-9 w-20 rounded-lg border-black/15"
                    onFocus={(event) => event.currentTarget.select()}
                    onChange={(event) => {
                      const value = Number(event.target.value) || 1;
                      void handleQuantityUpdate(item.sku, value);
                    }}
                  />
                  <Button variant="outline" className="rounded-full" onClick={() => void handleRemoveItem(item.sku)}>
                    Remove
                  </Button>
                </div>
                {pendingSku === item.sku ? <span className="text-xs text-muted-foreground">Syncing...</span> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-black/10 bg-white/90 shadow-sm lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPriceNgn(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>{formatPriceNgn(total)}</span>
            </div>
            <Link href="/checkout" className="block">
              <Button className="w-full rounded-full">Proceed to Checkout</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white/85 p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">You May Also Like</h2>
          <Link
            href="/products"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            Browse all
          </Link>
        </div>
        {isLoadingSuggestions ? (
          <p className="text-sm text-muted-foreground">Loading suggestions...</p>
        ) : suggestedProducts.length > 0 ? (
          <ProductGrid products={suggestedProducts} />
        ) : (
          <p className="text-sm text-muted-foreground">More styles are coming soon.</p>
        )}
      </section>
    </div>
  );
}
