"use client";

import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { encodeProductSlugForPath } from "@/lib/product-slug";
import { formatPriceNgn } from "@/lib/products";

type Product = {
 slug: string;
 name: string;
 category: string;
 image: string;
 price: number;
 sizes: string[];
 description?: string;
 rating?: number;
 reviewCount?: number;
};

export function ProductGrid({ products }: { products: Product[] }) {
 return (
 <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4 lg:gap-5">
 {products.map((product) => (
 <ProductCard key={product.slug} product={product} />
 ))}
 </div>
 );
}

function ProductCard({ product }: { product: Product }) {
 const reviewCount = product.reviewCount ?? 0;
 const rating = product.rating ?? 0;

 return (
 <Card className="group hover-lift flex h-full flex-col overflow-hidden rounded-2xl border-black/10 bg-white/95 shadow-[0_16px_40px_rgba(15,12,10,0.06)] sm:rounded-3xl">
 <CardHeader className="space-y-4 p-3 sm:p-5">
 <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#f5f0ea] ">
 <Image
 src={product.image}
 alt={product.name}
 width={900}
 height={900}
 unoptimized
 className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
 />
 </div>
 </CardHeader>

 <CardContent className="flex flex-1 flex-col items-center px-3 pb-4 text-center sm:px-5">
 <div className="flex flex-wrap items-center justify-center gap-2">
 <Badge
 variant="secondary"
 className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-[#4f4944] "
 >
 {product.category}
 </Badge>
 </div>

 <div className="mt-4 space-y-2">
 <CardTitle className="text-[1.55rem] leading-none text-[#1f1b18] sm:text-2xl">{product.name}</CardTitle>
 </div>

 <div className="mt-4 flex flex-col items-center gap-1">
 <p className="text-sm tracking-wide text-[#a47531] ">
 {reviewCount > 0 ? (
 <>
 {"★★★★★"} <span className="font-medium">({rating.toFixed(1)})</span>
 </>
 ) : (
 <span className="text-[#7c736b]">No ratings yet</span>
 )}
 </p>
 <p className="text-[0.8rem] uppercase tracking-[0.16em] text-[#5f5954] ">
 {reviewCount} review{reviewCount === 1 ? "" : "s"}
 </p>
 </div>

 <div className="mt-5 space-y-3">
 <p className="text-2xl font-semibold tracking-tight text-[#1f1b18] sm:text-3xl">
 {formatPriceNgn(product.price)}
 </p>
 <p className="text-[0.8rem] uppercase tracking-[0.16em] text-[#5f5954] ">Available sizes</p>
 {product.sizes.length > 0 ? (
 <div className="flex flex-wrap items-center justify-center gap-2">
 {product.sizes.map((size) => {
 return (
 <span
 key={`${product.slug}-${size}`}
 className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-black/15 bg-white px-3 py-2 text-xs font-medium text-[#4f4841]"
 >
 {size}
 </span>
 );
 })}
 </div>
 ) : (
 <p className="text-sm text-[#7c736b] ">One tailored size set is available.</p>
 )}
 </div>
 </CardContent>

 <CardFooter className="mt-auto p-4 pt-0 sm:p-5 sm:pt-0">
 <Link href={`/products/${encodeProductSlugForPath(product.slug)}`} className="w-full">
 <Button className="w-full rounded-full">View Product</Button>
 </Link>
 </CardFooter>
 </Card>
 );
}
