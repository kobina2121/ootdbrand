"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/components/store/cart-provider";
import { getVariantPrice, type Product } from "@/lib/products";

type AddToCartFormProps = {
  product: Product;
  sku?: string;
  onSkuChange?: (sku: string) => void;
  hideVariantSelect?: boolean;
};

export function AddToCartForm({ product, sku, onSkuChange, hideVariantSelect = false }: AddToCartFormProps) {
  const [internalSku, setInternalSku] = useState(product.variants[0]?.sku ?? "");
  const [quantity, setQuantity] = useState(1);
  const { addItem, userRole } = useCart();
  const isAdminUser = userRole === "admin";
  const activeSku = sku ?? internalSku;
  const setSku = (nextSku: string) => {
    if (typeof sku === "undefined") {
      setInternalSku(nextSku);
    }

    onSkuChange?.(nextSku);
  };

  const variant = useMemo(
    () => product.variants.find((entry) => entry.sku === activeSku),
    [activeSku, product.variants],
  );
  const unitPrice = getVariantPrice(product, activeSku);

  if (!variant) {
    return null;
  }

  const onAddToCart = async () => {
    if (isAdminUser) {
      toast.error("Admin accounts cannot place store orders.");
      return;
    }

    try {
      await addItem({
        slug: product.slug,
        name: product.name,
        image: variant.image ?? product.image,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        unitPrice,
        quantity,
      });

      toast.success("Added to cart", {
        description: `${product.name} · ${variant.size} / ${variant.color}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not add item to cart.";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {hideVariantSelect ? null : (
          <div>
            <p className="mb-2 text-sm font-medium">Variant</p>
            <Select value={activeSku} onValueChange={(value) => setSku(value ?? product.variants[0]?.sku ?? "")}>
              <SelectTrigger className="h-10 rounded-xl border-black/15 bg-white">
                <SelectValue placeholder="Select variant" />
              </SelectTrigger>
              <SelectContent>
                {product.variants.map((entry) => (
                  <SelectItem key={entry.sku} value={entry.sku}>
                    {entry.size} · {entry.color} ({entry.stock} left)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium">Quantity</p>
          <Input
            type="number"
            min={1}
            max={variant.stock}
            value={quantity}
            onChange={(event) => setQuantity(Math.min(variant.stock, Math.max(1, Number(event.target.value) || 1)))}
            className="h-10 w-28 rounded-xl border-black/15 bg-white"
          />
        </div>
      </div>

      <Button size="lg" className="w-full rounded-full sm:w-auto" onClick={onAddToCart} disabled={isAdminUser}>
        {isAdminUser
          ? "Admin cannot add to cart"
          : `Add to Cart · ${new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(unitPrice)}`}
      </Button>
    </div>
  );
}
