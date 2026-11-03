"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCart } from "@/components/store/cart-provider";
import { OutfitPreview } from "@/components/store/outfit-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COMBO_DISCOUNT_GHS, filterComboProducts, getDefaultComboSelection } from "@/lib/combo";
import { formatPriceNgn, type Product, type ProductVariant } from "@/lib/products";
import { encodeProductSlugForPath } from "@/lib/product-slug";
import { cn } from "@/lib/utils";

type PieceSelection = {
  slug: string;
  color: string;
  size: string;
};

function createSelection(product: Product): PieceSelection {
  return { slug: product.slug, ...getDefaultComboSelection(product.variants) };
}

function createInitialSelection(products: Product[], slug?: string) {
  const product = products.find((entry) => entry.slug === slug);
  return product ? createSelection(product) : null;
}

function findVariant(product: Product, selection: PieceSelection) {
  return product.variants.find((variant) => variant.color === selection.color && variant.size === selection.size);
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

function ComboProductBrowser({
  noun,
  products,
  selectedSlug,
  onSelect,
  onCancel,
}: {
  noun: string;
  products: Product[];
  selectedSlug?: string;
  onSelect: (product: Product) => void;
  onCancel?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const categories = Array.from(new Set(products.map((entry) => entry.category)));
  const visibleProducts = filterComboProducts(products, query, activeCategory);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#5f5954]" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${noun}...`}
          aria-label={`Search ${noun}`}
          className="h-11 border-[#1d1b1a]/30 bg-transparent pl-9"
        />
      </div>

      {categories.length > 1 ? (
        <div className="flex flex-wrap gap-x-4" role="group" aria-label={`Filter ${noun} by type`}>
          {["all", ...categories].map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={activeCategory === category}
              onClick={() => setActiveCategory(category)}
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

      {visibleProducts.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
          {visibleProducts.map((product) => {
            const isSoldOut = product.variants.every((variant) => variant.stock <= 0);

            return (
              <li key={product.slug}>
                <button
                  type="button"
                  aria-pressed={product.slug === selectedSlug}
                  onClick={() => onSelect(product)}
                  className="group block w-full text-left"
                >
                  <span className="relative block aspect-[3/4] overflow-hidden bg-[#e9e4da]">
                    <Image
                      src={product.image}
                      alt=""
                      fill
                      sizes="(max-width: 767px) 50vw, (max-width: 1279px) 25vw, 18vw"
                      className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                    {isSoldOut ? (
                      <span className="absolute top-2 left-2 bg-[#1d1b1a] px-2 py-1 text-[0.62rem] tracking-[0.14em] text-[#f6f2ea] uppercase">
                        Sold out
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-2 block font-heading text-xl leading-tight text-[#1d1b1a] underline-offset-4 group-hover:underline">
                    {product.name}
                  </span>
                  <span className="mt-0.5 block text-sm font-medium text-[#3d3731]">{formatPriceNgn(product.basePrice)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="border border-dashed border-[#1d1b1a]/30 p-6 text-center text-sm text-[#5f5954]" role="status">
          No {noun} match your search.
        </p>
      )}

      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-11 items-center text-xs tracking-[0.18em] text-[#1d1b1a] uppercase underline underline-offset-8"
        >
          Keep my choice
        </button>
      ) : null}
    </div>
  );
}

function ComboPieceOptions({
  product,
  selection,
  onChange,
  onRequestChange,
}: {
  product: Product;
  selection: PieceSelection;
  onChange: (selection: PieceSelection) => void;
  onRequestChange: () => void;
}) {
  const variant = findVariant(product, selection);
  const sizesForColor = product.variants.filter((entry) => entry.color === selection.color);

  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#e9e4da]">
        <Image
          src={getPreviewImage(product, selection, variant)}
          alt={`${product.name} in ${selection.color}`}
          fill
          sizes="10rem"
          className="object-cover object-top"
        />
      </div>

      <div className="min-w-0 space-y-1">
        <Link
          href={`/products/${encodeProductSlugForPath(product.slug)}`}
          className="font-heading text-2xl leading-tight text-[#1d1b1a] underline-offset-4 hover:underline"
        >
          {product.name}
        </Link>
        <p className="text-base font-medium text-[#1d1b1a]">{formatPriceNgn(variant?.priceOverride ?? product.basePrice)}</p>
        <button
          type="button"
          onClick={onRequestChange}
          aria-label={`Change ${product.name}`}
          className="inline-flex min-h-11 items-center text-xs tracking-[0.18em] text-[#1d1b1a] uppercase underline underline-offset-8"
        >
          Change
        </button>
      </div>

      <div className="col-span-2 space-y-2">
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

      <div className="col-span-2 space-y-2">
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
                onClick={() => onChange({ ...selection, size: entry.size })}
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
    </div>
  );
}

function ComboPiecePicker({
  number,
  label,
  noun,
  products,
  selection,
  onChange,
}: {
  number: string;
  label: string;
  noun: string;
  products: Product[];
  selection: PieceSelection | null;
  onChange: (selection: PieceSelection) => void;
}) {
  const [isBrowsing, setIsBrowsing] = useState(false);
  const product = products.find((entry) => entry.slug === selection?.slug);

  return (
    <section className="min-w-0 space-y-4 border-t border-[#1d1b1a] pt-4" aria-label={`Choose your ${label.toLowerCase()}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-4xl leading-none font-medium text-[#1d1b1a] sm:text-5xl">{label}</h2>
        <p className="text-xs tracking-[0.28em] text-[#7a1730]">N&deg; {number}</p>
      </div>

      {product && selection && !isBrowsing ? (
        <ComboPieceOptions
          product={product}
          selection={selection}
          onChange={onChange}
          onRequestChange={() => setIsBrowsing(true)}
        />
      ) : (
        <ComboProductBrowser
          noun={noun}
          products={products}
          selectedSlug={product?.slug}
          onSelect={(nextProduct) => {
            if (nextProduct.slug !== product?.slug) {
              onChange(createSelection(nextProduct));
            }

            setIsBrowsing(false);
          }}
          onCancel={product ? () => setIsBrowsing(false) : undefined}
        />
      )}
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
  const [topSelection, setTopSelection] = useState(() => createInitialSelection(tops, initialTopSlug));
  const [bottomSelection, setBottomSelection] = useState(() => createInitialSelection(bottoms, initialBottomSlug));
  const [isAdding, setIsAdding] = useState(false);

  const top = tops.find((product) => product.slug === topSelection?.slug);
  const bottom = bottoms.find((product) => product.slug === bottomSelection?.slug);
  const topVariant = top && topSelection ? findVariant(top, topSelection) : undefined;
  const bottomVariant = bottom && bottomSelection ? findVariant(bottom, bottomSelection) : undefined;
  const topPrice = top ? (topVariant?.priceOverride ?? top.basePrice) : 0;
  const bottomPrice = bottom ? (bottomVariant?.priceOverride ?? bottom.basePrice) : 0;
  const hasBothPieces = Boolean(top && bottom);
  const isAvailable = Boolean(topVariant && topVariant.stock > 0 && bottomVariant && bottomVariant.stock > 0);

  const handleAddCombo = async () => {
    if (!top || !bottom || !topVariant || !bottomVariant || !isAvailable || isAdding) {
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
      <ComboPiecePicker number="01" label="The Top" noun="tops" products={tops} selection={topSelection} onChange={setTopSelection} />
      <ComboPiecePicker
        number="02"
        label="The Bottom"
        noun="skirts, pants and capris"
        products={bottoms}
        selection={bottomSelection}
        onChange={setBottomSelection}
      />

      <aside className="space-y-4 border-t border-[#1d1b1a] pt-4 md:col-span-2 xl:sticky xl:top-32 xl:col-span-1 xl:self-start">
        <h2 className="font-heading text-4xl leading-none font-medium text-[#1d1b1a] sm:text-5xl">Your Combo</h2>

        {top && bottom && topSelection && bottomSelection ? (
          <div className="mx-auto w-full max-w-[15rem]">
            <OutfitPreview
              topImage={getPreviewImage(top, topSelection, topVariant)}
              bottomImage={getPreviewImage(bottom, bottomSelection, bottomVariant)}
              label={`${top.name} worn with ${bottom.name}`}
              sizes="15rem"
            />
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-[#5f5954]">
            Choose a top and a bottom to see your outfit and save {formatPriceNgn(COMBO_DISCOUNT_GHS)}.
          </p>
        )}

        <dl className="space-y-3 text-sm text-[#3d3731]">
          <div className="flex justify-between gap-4">
            <dt className="min-w-0">
              {top ? top.name : "Top"} {topSelection ? <span className="text-[#5f5954]">· {topSelection.size}</span> : null}
            </dt>
            <dd className="shrink-0">{top ? formatPriceNgn(topPrice) : "Not chosen"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="min-w-0">
              {bottom ? bottom.name : "Bottom"} {bottomSelection ? <span className="text-[#5f5954]">· {bottomSelection.size}</span> : null}
            </dt>
            <dd className="shrink-0">{bottom ? formatPriceNgn(bottomPrice) : "Not chosen"}</dd>
          </div>
          {hasBothPieces ? (
            <>
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
            </>
          ) : null}
        </dl>
        <Button
          type="button"
          className="h-12 w-full rounded-none"
          onClick={() => void handleAddCombo()}
          disabled={!isAvailable || isAdding || userRole === "admin"}
        >
          {userRole === "admin" ? (
            "Admin cannot add to cart"
          ) : !hasBothPieces ? (
            "Choose both pieces"
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
