"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCart } from "@/components/store/cart-provider";
import { OutfitPreview } from "@/components/store/outfit-preview";
import { Button } from "@/components/ui/button";
import { COMBO_DISCOUNT_GHS, getDefaultComboSelection } from "@/lib/combo";
import { formatPriceNgn, type Product, type ProductVariant } from "@/lib/products";
import { encodeProductSlugForPath } from "@/lib/product-slug";
import { cn } from "@/lib/utils";

type PieceSelection = {
  slug: string;
  color: string;
  size: string;
};

function createSelection(product: Product | undefined): PieceSelection {
  return { slug: product?.slug ?? "", ...getDefaultComboSelection(product?.variants ?? []) };
}

function findVariant(product: Product | undefined, selection: PieceSelection) {
  return product?.variants.find((variant) => variant.color === selection.color && variant.size === selection.size);
}

function getColors(product: Product) {
  return Array.from(
    new Map(product.variants.map((variant) => [variant.color, { name: variant.color, code: variant.colorCode }])).values(),
  );
}

function getPreviewImage(product: Product, selection: PieceSelection, variant?: ProductVariant) {
  const colorVariant = product.variants.find((entry) => entry.color === selection.color && entry.image);
  return variant?.image ?? colorVariant?.image ?? product.image;
}

function ComboPiecePicker({
  number,
  label,
  products,
  selection,
  onChange,
}: {
  number: string;
  label: string;
  products: Product[];
  selection: PieceSelection;
  onChange: (selection: PieceSelection) => void;
}) {
  const product = products.find((entry) => entry.slug === selection.slug) ?? products[0];
  const variant = findVariant(product, selection);
  const sizesForColor = product.variants.filter((entry) => entry.color === selection.color);
  const categories = Array.from(new Set(products.map((entry) => entry.category)));
  const [activeCategory, setActiveCategory] = useState("all");
  const visibleProducts =
    activeCategory === "all" ? products : products.filter((entry) => entry.category === activeCategory);

  return (
    <section className="min-w-0 space-y-4 border-t border-[#1d1b1a] pt-4" aria-label={`Choose your ${label.toLowerCase()}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-4xl leading-none font-medium text-[#1d1b1a] sm:text-5xl">{label}</h2>
        <p className="text-xs tracking-[0.28em] text-[#7a1730]">N&deg; {number}</p>
      </div>

      <div className="relative aspect-[3/4] overflow-hidden bg-[#e9e4da]">
        <Image
          src={getPreviewImage(product, selection, variant)}
          alt={`${product.name} in ${selection.color}`}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 36vw"
          className="object-cover object-top"
        />
      </div>

      {categories.length > 1 ? (
        <div className="flex flex-wrap gap-x-4" aria-label={`Filter ${label.toLowerCase()} by type`}>
          {["all", ...categories].map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={activeCategory === category}
              onClick={() => {
                setActiveCategory(category);
                const nextProducts = category === "all" ? products : products.filter((entry) => entry.category === category);

                if (!nextProducts.some((entry) => entry.slug === product.slug)) {
                  onChange(createSelection(nextProducts[0]));
                }
              }}
              className={cn(
                "inline-flex min-h-11 items-center text-xs tracking-[0.18em] uppercase underline-offset-8 transition-colors",
                activeCategory === category ? "text-[#1d1b1a] underline" : "text-[#5f5954] hover:text-[#1d1b1a]",
              )}
            >
              {category === "all" ? "All" : category}
            </button>
          ))}
        </div>
      ) : null}

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {visibleProducts.map((entry) => {
          const isSelected = entry.slug === product.slug;

          return (
            <button
              key={entry.slug}
              type="button"
              aria-label={`Choose ${entry.name}`}
              aria-pressed={isSelected}
              onClick={() => onChange(createSelection(entry))}
              className={cn(
                "relative aspect-[3/4] w-16 shrink-0 overflow-hidden border bg-[#e9e4da] transition sm:w-20",
                isSelected ? "border-[#1d1b1a] ring-1 ring-[#1d1b1a]" : "border-black/10 hover:border-black/40",
              )}
            >
              <Image src={entry.image} alt="" fill sizes="5rem" className="object-cover object-top" />
            </button>
          );
        })}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/products/${encodeProductSlugForPath(product.slug)}`}
            className="font-heading text-2xl leading-tight text-[#1d1b1a] underline-offset-4 hover:underline sm:text-3xl"
          >
            {product.name}
          </Link>
        </div>
        <p className="shrink-0 pt-1 text-base font-medium text-[#1d1b1a]">
          {formatPriceNgn(variant?.priceOverride ?? product.basePrice)}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[0.68rem] tracking-[0.18em] text-[#5f5954] uppercase">Color: {selection.color}</p>
        <div className="flex flex-wrap gap-2">
          {getColors(product).map((color) => {
            const isSelected = color.name === selection.color;

            return (
              <button
                key={color.name}
                type="button"
                title={color.name}
                aria-label={color.name}
                aria-pressed={isSelected}
                onClick={() => {
                  const options = product.variants.filter((entry) => entry.color === color.name);
                  const nextVariant =
                    options.find((entry) => entry.size === selection.size && entry.stock > 0) ??
                    options.find((entry) => entry.stock > 0) ??
                    options[0];
                  onChange({ slug: product.slug, color: color.name, size: nextVariant?.size ?? "" });
                }}
                className={cn(
                  "inline-flex size-11 items-center justify-center rounded-full border bg-transparent p-1 transition",
                  isSelected ? "border-black ring-2 ring-black/15" : "border-black/20 hover:border-black/50",
                )}
              >
                <span
                  className="block h-full w-full rounded-full border border-black/10"
                  style={{ backgroundColor: color.code ?? "#D1D5DB" }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[0.68rem] tracking-[0.18em] text-[#5f5954] uppercase">Size</p>
        <div className="flex flex-wrap gap-2">
          {sizesForColor.map((entry) => {
            const isSelected = entry.size === selection.size;
            const isInStock = entry.stock > 0;

            return (
              <button
                key={entry.sku}
                type="button"
                disabled={!isInStock}
                aria-pressed={isSelected}
                aria-label={`${entry.size}${isInStock ? "" : ", out of stock"}`}
                onClick={() => onChange({ ...selection, slug: product.slug, size: entry.size })}
                className={cn(
                  "inline-flex min-h-11 min-w-11 items-center justify-center border px-3 text-xs font-medium transition",
                  isSelected
                    ? "border-black bg-black text-white"
                    : isInStock
                      ? "border-black/20 text-[#3d3731] hover:border-black/60"
                      : "border-black/10 text-[#3d3731]/40 line-through",
                )}
              >
                {entry.size}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ComboBuilder({
  tops,
  bottoms,
  initialTopSlug,
  initialBottomSlug,
}: {
  tops: Product[];
  bottoms: Product[];
  initialTopSlug?: string;
  initialBottomSlug?: string;
}) {
  const { addItems, userRole } = useCart();
  const [topSelection, setTopSelection] = useState(() =>
    createSelection(tops.find((product) => product.slug === initialTopSlug) ?? tops[0]),
  );
  const [bottomSelection, setBottomSelection] = useState(() =>
    createSelection(bottoms.find((product) => product.slug === initialBottomSlug) ?? bottoms[0]),
  );
  const [isAdding, setIsAdding] = useState(false);

  const top = tops.find((product) => product.slug === topSelection.slug) ?? tops[0];
  const bottom = bottoms.find((product) => product.slug === bottomSelection.slug) ?? bottoms[0];
  const topVariant = findVariant(top, topSelection);
  const bottomVariant = findVariant(bottom, bottomSelection);
  const topPrice = topVariant?.priceOverride ?? top.basePrice;
  const bottomPrice = bottomVariant?.priceOverride ?? bottom.basePrice;
  const isAvailable = Boolean(topVariant && topVariant.stock > 0 && bottomVariant && bottomVariant.stock > 0);

  const handleAddCombo = async () => {
    if (!topVariant || !bottomVariant || !isAvailable || isAdding) {
      return;
    }

    try {
      setIsAdding(true);
      await addItems(
        [
          { product: top, variant: topVariant, price: topPrice },
          { product: bottom, variant: bottomVariant, price: bottomPrice },
        ].map(({ product, variant, price }) => ({
          slug: product.slug,
          name: variant.name?.trim() || product.name,
          image: variant.image ?? product.image,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          unitPrice: price,
          quantity: 1,
        })),
      );
      toast.success("Combo added to cart", {
        description: `${top.name} + ${bottom.name}`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add combo to cart.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(18rem,22rem)] xl:gap-8">
      <ComboPiecePicker number="01" label="The Top" products={tops} selection={topSelection} onChange={setTopSelection} />
      <ComboPiecePicker number="02" label="The Bottom" products={bottoms} selection={bottomSelection} onChange={setBottomSelection} />

      <aside className="space-y-4 border-t border-[#1d1b1a] pt-4 md:col-span-2 xl:sticky xl:top-32 xl:col-span-1 xl:self-start">
        <h2 className="font-heading text-4xl leading-none font-medium text-[#1d1b1a] sm:text-5xl">Your Combo</h2>
        <div className="mx-auto w-full max-w-[15rem]">
          <OutfitPreview
            topImage={getPreviewImage(top, topSelection, topVariant)}
            bottomImage={getPreviewImage(bottom, bottomSelection, bottomVariant)}
            label={`${top.name} worn with ${bottom.name}`}
            sizes="15rem"
          />
        </div>
        <dl className="space-y-3 text-sm text-[#3d3731]">
          <div className="flex justify-between gap-4">
            <dt className="min-w-0">
              {top.name} <span className="text-[#5f5954]">· {topSelection.size}</span>
            </dt>
            <dd className="shrink-0">{formatPriceNgn(topPrice)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="min-w-0">
              {bottom.name} <span className="text-[#5f5954]">· {bottomSelection.size}</span>
            </dt>
            <dd className="shrink-0">{formatPriceNgn(bottomPrice)}</dd>
          </div>
          <div className="flex justify-between gap-4 text-emerald-700">
            <dt>Combo saving</dt>
            <dd>-{formatPriceNgn(COMBO_DISCOUNT_GHS)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-[#1d1b1a]/20 pt-3 text-[#1d1b1a]">
            <dt className="font-medium">Combo price</dt>
            <dd className="font-heading text-4xl font-medium">
              {formatPriceNgn(topPrice + bottomPrice - COMBO_DISCOUNT_GHS)}
            </dd>
          </div>
        </dl>
        <Button
          type="button"
          className="h-12 w-full rounded-none"
          onClick={() => void handleAddCombo()}
          disabled={!isAvailable || isAdding || userRole === "admin"}
        >
          {userRole === "admin" ? (
            "Admin cannot add to cart"
          ) : !isAvailable ? (
            "Option out of stock"
          ) : isAdding ? (
            "Adding..."
          ) : (
            <>
              <Plus className="size-4" /> Add Combo to Cart
            </>
          )}
        </Button>
        <Link
          href="/cart"
          className="inline-flex min-h-11 items-center gap-2 text-xs tracking-[0.22em] text-[#1d1b1a] uppercase underline-offset-4 hover:underline"
        >
          View cart <ArrowRight className="size-4" />
        </Link>
        <p className="text-xs leading-relaxed text-[#5f5954]">
          A transaction fee is added at checkout. If you also use a coupon, you get whichever saving is bigger.
        </p>
      </aside>
    </div>
  );
}
