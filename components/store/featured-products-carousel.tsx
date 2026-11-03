"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/components/store/cart-provider";
import { encodeProductSlugForPath } from "@/lib/product-slug";
import { cn } from "@/lib/utils";

type FeaturedProductVariant = {
 name?: string;
 size: string;
 color: string;
 colorCode?: string;
 image?: string;
 sku: string;
 stock: number;
 priceOverride?: number;
};

type FeaturedProductColor = {
 name: string;
 code?: string;
};

type FeaturedProductSlide = {
 slug: string;
 name: string;
 category: string;
 sizes?: string[];
 colors?: FeaturedProductColor[];
 variants?: FeaturedProductVariant[];
 rating?: number;
 reviewCount?: number;
 price: string;
 priceValue: number;
 image: string;
};

export function FeaturedProductsCarousel({ items }: { items: FeaturedProductSlide[] }) {
 const [activeIndex, setActiveIndex] = useState(0);
 const [isPaused, setIsPaused] = useState(false);
 const containerRef = useRef<HTMLDivElement | null>(null);
 const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
 const count = items.length;

 const goTo = (index: number) => {
 if (count === 0) {
 return;
 }

 const nextIndex = (index + count) % count;
 setActiveIndex(nextIndex);
 const container = containerRef.current;
 const item = itemRefs.current[nextIndex];

 if (container && item) {
 container.scrollTo({
 left: item.offsetLeft,
 behavior: "smooth",
 });
 }
 };

 const next = () => goTo(activeIndex + 1);
 const prev = () => goTo(activeIndex - 1);

 useEffect(() => {
 if (isPaused || count <= 1) {
 return;
 }

 const timer = setInterval(() => {
 setActiveIndex((prevIndex) => {
 const nextIndex = (prevIndex + 1) % count;
 const container = containerRef.current;
 const item = itemRefs.current[nextIndex];

 if (container && item) {
 container.scrollTo({
 left: item.offsetLeft,
 behavior: "smooth",
 });
 }

 return nextIndex;
 });
 }, 4000);

 return () => clearInterval(timer);
 }, [count, isPaused]);

 const dots = useMemo(() => items.map((_, i) => i), [items]);

 if (items.length === 0) {
 return <p className="text-sm text-muted-foreground">Featured products will appear here soon.</p>;
 }

 return (
 <div className="space-y-6">
 <div
 className="relative"
 onMouseEnter={() => setIsPaused(true)}
 onMouseLeave={() => setIsPaused(false)}
 >
 <div
 ref={containerRef}
	 className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1"
 onTouchStart={() => setIsPaused(true)}
 onTouchEnd={() => setIsPaused(false)}
 >
	 {items.map((product, index) => {
	 return (
	 <FeaturedProductCard
	 key={product.slug}
	 product={product}
	 itemRef={(el) => {
	 itemRefs.current[index] = el;
	 }}
	 />
	 );
	 })}
</div>
 </div>

 <div className="grid grid-cols-[1fr_auto_1fr] items-center">
 <Button
 type="button"
 size="icon"
 variant="ghost"
 className="justify-self-start rounded-full "
 onClick={prev}
 >
 <ChevronLeft className="size-6 text-[#374151] " />
 <span className="sr-only">Previous featured products</span>
 </Button>

 <div className="flex items-center justify-center gap-2">
 {dots.map((dot) => (
 <button
 key={dot}
 type="button"
 onClick={() => goTo(dot)}
 className="flex h-11 min-w-11 items-center justify-center rounded-full transition-all"
 aria-label={`Go to featured product ${dot + 1}`}
 >
 <span className={cn("block h-0.5 transition-all", activeIndex === dot ? "w-8 bg-[#1d1b1a]" : "w-4 bg-[#1d1b1a]/30")} />
 </button>
 ))}
 </div>

 <Button
 type="button"
 size="icon"
 variant="ghost"
 className="justify-self-end rounded-full "
 onClick={next}
 >
 <ChevronRight className="size-6 text-[#374151] " />
 <span className="sr-only">Next featured products</span>
 </Button>
 </div>
 </div>
 );
}

function FeaturedProductCard({
 product,
 itemRef,
}: {
 product: FeaturedProductSlide;
 itemRef: (el: HTMLDivElement | null) => void;
}) {
 const reviewCount = product.reviewCount ?? 0;
 const rating = product.rating ?? 0;
 const { addItem, items, userRole } = useCart();
 const [selectedColor, setSelectedColor] = useState("");
 const [selectedSize, setSelectedSize] = useState("");
 const [isAdding, setIsAdding] = useState(false);
 const variants = useMemo(() => product.variants ?? [], [product.variants]);
 const colorOptions = useMemo(() => {
 if (product.colors && product.colors.length > 0) {
 return product.colors;
 }

 return Array.from(
 new Map(
 variants.map((variant) => [
 variant.color,
 { name: variant.color, code: variant.colorCode },
 ]),
 ).values(),
 );
 }, [product.colors, variants]);
 const availableSizes = useMemo(() => {
 if (!selectedColor || variants.length === 0) {
 const sizes = product.sizes ?? Array.from(new Set(variants.map((variant) => variant.size)));
 return sizes.map((size) => ({ size, inStock: true }));
 }

 return variants
 .filter((variant) => variant.color === selectedColor)
 .map((variant) => ({ size: variant.size, inStock: variant.stock > 0 }));
 }, [product.sizes, selectedColor, variants]);
 const selectedVariant =
 selectedColor && selectedSize
 ? variants.find((variant) => variant.color === selectedColor && variant.size === selectedSize)
 : undefined;
 const selectedColorVariant = selectedColor
 ? variants.find((variant) => variant.color === selectedColor && variant.stock > 0) ??
 variants.find((variant) => variant.color === selectedColor)
 : undefined;
 const previewVariant = selectedVariant ?? selectedColorVariant;
 const previewImage = previewVariant?.image ?? product.image;
 const selectedVariantInStock = Boolean(selectedVariant && selectedVariant.stock > 0);
 const showQuickAdd = Boolean(selectedColor && selectedSize && selectedVariant);
 const cartItem = selectedVariant ? items.find((item) => item.sku === selectedVariant.sku) : undefined;
 const isSelectedVariantInCart = Boolean(cartItem);

 const handleQuickAdd = async () => {
 if (isAdding) {
 return;
 }

 if (!selectedVariant) {
 return;
 }

 if (isSelectedVariantInCart) {
 toast.success("Already in cart", {
 description: `${cartItem?.quantity ?? 1} × ${selectedVariant.name?.trim() || product.name} · ${selectedVariant.size} / ${selectedVariant.color}`,
 });
 return;
 }

 if (userRole === "admin") {
 toast.error("Admin accounts cannot place store orders.");
 return;
 }

 if (!selectedVariantInStock) {
 toast.error("This option is out of stock.");
 return;
 }

 const selectedProductName = selectedVariant.name?.trim() || product.name;

 try {
 setIsAdding(true);
 await addItem({
 slug: product.slug,
 name: selectedProductName,
 image: selectedVariant.image ?? product.image,
 sku: selectedVariant.sku,
 size: selectedVariant.size,
 color: selectedVariant.color,
 unitPrice: selectedVariant.priceOverride ?? product.priceValue,
 quantity: 1,
 });

 toast.success("Added to cart", {
 description: `${selectedProductName} · ${selectedVariant.size} / ${selectedVariant.color}`,
 });
 } catch (error) {
 const message = error instanceof Error ? error.message : "Could not add item to cart.";
 toast.error(message);
 } finally {
 setIsAdding(false);
 }
 };

 return (
 <div ref={itemRef} className="min-w-[82%] snap-center sm:min-w-[calc(50%-8px)] lg:min-w-[calc(33.333%-11px)] xl:min-w-[calc(25%-12px)]">
 <Card className="group h-full gap-0 overflow-hidden rounded-none bg-transparent py-0 shadow-none ring-0">
 <div className="relative aspect-[3/4] overflow-hidden bg-[#e9e4da]">
 <Image
 src={previewImage}
 alt={selectedColor ? `${product.name} in ${selectedColor}` : product.name}
 fill
 sizes="(max-width: 639px) 88vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
 className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
 />
 </div>
 <CardContent className="space-y-2 px-0 pt-3 pb-1 text-left sm:space-y-3 sm:pt-4">
 <Link
 href={`/products?category=${encodeURIComponent(product.category)}`}
 className="inline-flex text-[0.7rem] uppercase tracking-[0.2em] text-[#6b7280] underline-offset-4 transition hover:text-[#1f2937] hover:underline "
 >
 {product.category}
 </Link>
 <h3 className="font-heading text-[1.35rem] leading-tight text-[#1d1b1a] sm:text-[1.7rem]">{product.name}</h3>
 <div className="space-y-2 text-sm text-[#5f6368] ">
 {colorOptions.length > 0 ? (
 <div className="space-y-1">
 <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[#7a7f85] ">Available Colors</p>
 <div className="flex flex-wrap justify-start gap-1.5">
 {colorOptions.map((color) => {
 const isSelected = selectedColor === color.name;

 return (
 <button
 key={`${product.slug}-featured-color-${color.name}-${color.code ?? "color"}`}
 type="button"
 title={color.name}
 aria-label={color.name}
 aria-pressed={isSelected}
 onClick={() => {
 setSelectedColor(color.name);
 const nextSizes = variants.filter((variant) => variant.color === color.name);
 if (selectedSize && !nextSizes.some((variant) => variant.size === selectedSize)) {
 setSelectedSize("");
 }
 }}
 className={cn(
 "inline-flex h-8 w-8 items-center justify-center rounded-full border bg-white p-1 transition",
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
 {selectedColor ? (
 <p className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-[#1f2937]">Selected: {selectedColor}</p>
 ) : null}
 </div>
 ) : null}
 {availableSizes.length > 0 ? (
 <div className="space-y-1">
 <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[#7a7f85] ">Available Sizes</p>
 <div className="flex flex-wrap justify-start gap-1.5">
 {availableSizes.map(({ size, inStock }) => {
 const isSelected = selectedSize === size;

 return (
 <button
 key={`${product.slug}-featured-size-${size}`}
 type="button"
 onClick={() => setSelectedSize(size)}
 disabled={Boolean(selectedColor) && !inStock}
 aria-pressed={isSelected}
 className={cn(
 "inline-flex min-w-9 items-center justify-center border px-2.5 py-1 text-[0.68rem] font-medium transition",
 isSelected
 ? "border-black bg-black text-white"
 : Boolean(selectedColor) && !inStock
 ? "border-red-200 bg-red-50 text-red-700 opacity-60"
 : "border-black/20 bg-transparent text-[#3d3731] hover:border-black/60",
 )}
 >
 {size}
 </button>
 );
 })}
 </div>
 </div>
 ) : null}
 </div>
 <div className="space-y-1">
 <p className="text-sm tracking-wide text-[#a47531]">
 {reviewCount > 0 ? `★★★★★ (${rating.toFixed(1)})` : "No ratings yet"}
 </p>
 <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[#6b6b6b]">
 {reviewCount} review{reviewCount === 1 ? "" : "s"}
 </p>
 </div>
 <p className="pt-2 text-left text-xl font-medium text-[#1d1b1a] ">{product.price}</p>
 <div className="grid grid-cols-[1fr_auto] gap-2 pt-1 text-center">
 <Link
 href={`/products/${encodeProductSlugForPath(product.slug)}`}
 className={cn(
 buttonVariants({ variant: "outline", size: "sm" }),
 "min-h-11 rounded-none border-[#1d1b1a] bg-transparent px-5 text-[#1d1b1a] hover:bg-[#1d1b1a] hover:text-[#f6f2ea] ",
 )}
 >
 View Product
 </Link>
 {showQuickAdd ? (
 <Button
 type="button"
 size="icon"
 variant={isSelectedVariantInCart || (selectedVariantInStock && userRole !== "admin") ? "default" : "outline"}
 className="h-11 w-11 rounded-none"
 onClick={handleQuickAdd}
 disabled={isAdding || isSelectedVariantInCart || !selectedVariantInStock || userRole === "admin"}
 aria-label={
 isAdding
 ? `Adding ${product.name} to cart`
 : isSelectedVariantInCart
 ? `${product.name} ${selectedSize} ${selectedColor} is in cart`
 : selectedVariantInStock
 ? `Add ${product.name} ${selectedSize} ${selectedColor} to cart`
 : "Selected option is out of stock"
 }
 title={isAdding ? "Adding..." : isSelectedVariantInCart ? "In cart" : selectedVariantInStock ? "Add to cart" : "Out of stock"}
 >
 {isAdding ? <LoaderCircle className="size-4 animate-spin" /> : isSelectedVariantInCart ? <CheckCircle2 className="size-4" /> : <ShoppingCart className="size-4" />}
 </Button>
 ) : null}
 </div>
 {isSelectedVariantInCart ? (
 <p className="text-left text-[0.68rem] font-medium uppercase tracking-[0.14em] text-emerald-700">
 In cart · {cartItem?.quantity ?? 1}
 </p>
 ) : null}
 </CardContent>
 </Card>
 </div>
 );
}
