"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildProductHref } from "@/lib/product-slug";
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

export function FeaturedProductsCarousel({ items, label = "featured" }: { items: FeaturedProductSlide[]; label?: string }) {
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
 <span className="sr-only">Previous {label} products</span>
 </Button>

 <div className="flex items-center justify-center gap-2">
 {dots.map((dot) => (
 <button
 key={dot}
 type="button"
 onClick={() => goTo(dot)}
 className="flex h-11 min-w-11 items-center justify-center rounded-full transition-all"
 aria-label={`Go to ${label} product ${dot + 1}`}
 >
 {activeIndex === dot ? (
 <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#1f2937] bg-transparent">
 <span className="block h-1.5 w-1.5 rounded-full bg-[#1f2937] " />
 </span>
 ) : (
 <span className="block h-2.5 w-2.5 rounded-full bg-[#1f2937]/80 " />
 )}
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
 <span className="sr-only">Next {label} products</span>
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
 const variants = product.variants ?? [];
 const colorOptions =
 product.colors && product.colors.length > 0
 ? product.colors
 : Array.from(
 new Map(
 variants.map((variant) => [
 variant.color,
 { name: variant.color, code: variant.colorCode },
 ]),
 ).values(),
 );
 const sizes = product.sizes ?? Array.from(new Set(variants.map((variant) => variant.size)));

 return (
 <div ref={itemRef} className="min-w-[82%] snap-center sm:min-w-[calc(50%-8px)] lg:min-w-[calc(33.333%-11px)] xl:min-w-[calc(25%-12px)]">
 <Card className="group h-full overflow-hidden border-[#cfd3d8] bg-white shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-md ">
 <div className="relative aspect-[4/3] overflow-hidden bg-[#dedede] p-3 sm:p-6">
 <Image
 src={product.image}
 alt={product.name}
 fill
 sizes="(max-width: 639px) 88vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
 className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
 />
 </div>
 <CardContent className="space-y-2 p-3 text-center sm:space-y-3 sm:p-5">
 <Link
 href={`/products?category=${encodeURIComponent(product.category)}`}
 className="inline-flex text-[0.7rem] uppercase tracking-[0.2em] text-[#6b7280] underline-offset-4 transition hover:text-[#1f2937] hover:underline "
 >
 {product.category}
 </Link>
 <h3 className="font-heading text-[1.35rem] leading-tight text-[#1f2937] sm:text-[1.7rem]">{product.name}</h3>
 <div className="space-y-2 text-sm text-[#5f6368] ">
 {colorOptions.length > 0 ? (
 <div className="space-y-1">
 <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[#7a7f85] ">Available Colors</p>
 <div className="flex flex-wrap justify-center gap-1.5">
 {colorOptions.map((color) => (
 <Link
 key={`${product.slug}-featured-color-${color.name}-${color.code ?? "color"}`}
 href={buildProductHref(product.slug, { color: color.name })}
 title={color.name}
 aria-label={`View ${product.name} in ${color.name}`}
 className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/20 bg-white p-1 transition hover:border-black/50"
 >
 <span
 className="block h-full w-full rounded-full border border-black/10"
 style={{ backgroundColor: color.code ?? "#D1D5DB" }}
 />
 </Link>
 ))}
 </div>
 </div>
 ) : null}
 {sizes.length > 0 ? (
 <div className="space-y-1">
 <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[#7a7f85] ">Available Sizes</p>
 <div className="flex flex-wrap justify-center gap-1.5">
 {sizes.map((size) => (
 <Link
 key={`${product.slug}-featured-size-${size}`}
 href={buildProductHref(product.slug, { size })}
 aria-label={`View ${product.name} in size ${size}`}
 className="inline-flex min-w-9 items-center justify-center rounded-full border border-black/10 bg-[#f8f5f1] px-2.5 py-1 text-[0.68rem] font-medium text-[#3d3731] transition hover:border-black/40"
 >
 {size}
 </Link>
 ))}
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
 <p className="pt-2 text-center text-2xl font-semibold text-[#111827] ">{product.price}</p>
 <div className="pt-1 text-center">
 <Link
 href={buildProductHref(product.slug)}
 className={cn(
 buttonVariants({ variant: "outline", size: "sm" }),
 "min-h-11 w-full rounded-full border-black/20 px-5 text-[#1f2937] hover:border-black hover:bg-black hover:text-white ",
 )}
 >
 View Product
 </Link>
 </div>
 </CardContent>
 </Card>
 </div>
 );
}
