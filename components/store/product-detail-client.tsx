"use client";

import { useMemo, useState } from "react";

import { AddToCartForm } from "@/components/store/add-to-cart-form";
import { Badge } from "@/components/ui/badge";
import { type Product } from "@/lib/products";

type ProductDetailClientProps = {
  product: Product;
};

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const colorOptions = useMemo(() => {
    const colorMap = new Map<string, { name: string; code: string }>();

    product.variants.forEach((variant) => {
      if (!colorMap.has(variant.color)) {
        colorMap.set(variant.color, {
          name: variant.color,
          code: variant.colorCode ?? "#9CA3AF",
        });
      }
    });

    return Array.from(colorMap.values());
  }, [product.variants]);

  const firstVariant = product.variants[0];
  const [selectedColor, setSelectedColor] = useState(firstVariant?.color ?? "");
  const [selectedSize, setSelectedSize] = useState(firstVariant?.size ?? "");

  const variantsForColor = useMemo(
    () => product.variants.filter((variant) => variant.color === selectedColor),
    [product.variants, selectedColor],
  );

  const availableSizes = useMemo(
    () => Array.from(new Set(variantsForColor.map((variant) => variant.size))),
    [variantsForColor],
  );

  const selectedVariant = useMemo(() => {
    const exact = variantsForColor.find((variant) => variant.size === selectedSize);
    if (exact) {
      return exact;
    }

    return variantsForColor[0] ?? product.variants[0];
  }, [product.variants, selectedSize, variantsForColor]);

  const inStock = product.variants.some((variant) => variant.stock > 0);
  const displayImage = selectedVariant?.image ?? product.image;

  return (
    <div className="grid gap-8 rounded-3xl border border-black/10 bg-white/85 p-4 shadow-sm lg:grid-cols-2 lg:p-6">
      <div className="overflow-hidden rounded-2xl">
        <img src={displayImage} alt={product.name} className="h-[520px] w-full object-cover object-center" />
      </div>

      <section className="space-y-5">
        <Badge variant={inStock ? "default" : "destructive"} className="rounded-full">
          {inStock ? "In Stock" : "Out of Stock"}
        </Badge>

        <h1 className="font-heading text-5xl leading-none text-[#1f1b18]">{product.name}</h1>
        <p className="text-sm text-[#6c655f] sm:text-base">{product.description}</p>

        <div className="space-y-2">
          <p className="text-sm tracking-[0.18em] text-muted-foreground">SELECT COLOR</p>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((colorOption) => (
              <button
                key={`color-${colorOption.name}`}
                type="button"
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                  selectedColor === colorOption.name
                    ? "border-black bg-black text-white"
                    : "border-black/20 bg-white text-black hover:border-black/40"
                }`}
                onClick={() => {
                  setSelectedColor(colorOption.name);
                  const firstSizeForColor = product.variants.find((variant) => variant.color === colorOption.name)?.size;
                  if (firstSizeForColor) {
                    setSelectedSize(firstSizeForColor);
                  }
                }}
              >
                <span
                  className="inline-block h-3 w-3 rounded-full border border-black/20"
                  style={{ backgroundColor: colorOption.code }}
                />
                {colorOption.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm tracking-[0.18em] text-muted-foreground">AVAILABLE SIZES</p>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => (
              <button
                key={`size-${size}`}
                type="button"
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  selectedSize === size
                    ? "border-black bg-black text-white"
                    : "border-black/20 bg-white text-black hover:border-black/40"
                }`}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <p className="text-2xl font-semibold">
          Starting from{" "}
          {new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(
            product.basePrice,
          )}
        </p>

        {inStock && selectedVariant ? (
          <div className="rounded-2xl border border-black/10 bg-[#f8f6f2] p-4">
            <AddToCartForm product={product} sku={selectedVariant.sku} hideVariantSelect />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">This item is currently unavailable.</p>
        )}
      </section>
    </div>
  );
}
