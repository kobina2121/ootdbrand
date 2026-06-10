"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPriceNgn } from "@/lib/products";

type Product = {
 slug: string;
 name: string;
 category: string;
 image: string;
 price: number;
 sizes: string[];
 description?: string;
 stockStatus?: "In Stock" | "Low Stock" | "Out of Stock";
 rating?: number;
 reviewCount?: number;
};

export function ProductGrid({ products }: { products: Product[] }) {
 return (
 <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
 {products.map((product) => (
 <ProductCard key={product.slug} product={product} />
 ))}
 </div>
 );
}

function ProductCard({ product }: { product: Product }) {
 const initialSize = useMemo(() => product.sizes[0] ?? null, [product.sizes]);
 const [selectedSize, setSelectedSize] = useState<string | null>(initialSize);

 const stockTone =
 product.stockStatus === "Out of Stock"
 ? "border-rose-500/20 bg-rose-500/10 text-rose-700 "
 : product.stockStatus === "Low Stock"
 ? "border-amber-500/20 bg-amber-500/10 text-amber-700 "
 : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 ";

 return (
 <Card className="group hover-lift flex h-full flex-col overflow-hidden rounded-3xl border-black/10 bg-white/95 shadow-[0_16px_40px_rgba(15,12,10,0.06)] ">
 <CardHeader className="space-y-4 p-4 sm:p-5">
 <div className="relative overflow-hidden rounded-2xl bg-[#f5f0ea] ">
 <Image
 src={product.image}
 alt={product.name}
 width={900}
 height={900}
 unoptimized
 className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-72"
 />
 </div>
 </CardHeader>

 <CardContent className="flex flex-1 flex-col items-center px-4 pb-4 text-center sm:px-5">
 <div className="flex flex-wrap items-center justify-center gap-2">
 <Badge
 variant="secondary"
 className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-[0.68rem] uppercase tracking-[0.24em] text-[#5c554f] "
 >
 {product.category}
 </Badge>
 <Badge className={`rounded-full border px-3 py-1 text-[0.68rem] uppercase tracking-[0.2em] ${stockTone}`}>
 {product.stockStatus ?? "In Stock"}
 </Badge>
 </div>

 <div className="mt-4 space-y-2">
 <CardTitle className="text-2xl text-[#1f1b18] ">{product.name}</CardTitle>
 {product.description ? (
 <p className="mx-auto max-w-[28ch] text-sm leading-6 text-[#6f675f] ">
 {product.description}
 </p>
 ) : null}
 </div>

 <div className="mt-4 flex flex-col items-center gap-1">
 <p className="text-sm tracking-wide text-[#a47531] ">
 {"★★★★★"} <span className="font-medium">({(product.rating ?? 5).toFixed(1)})</span>
 </p>
 <p className="text-xs uppercase tracking-[0.24em] text-[#94867a] ">
 {product.reviewCount ?? 0} reviews
 </p>
 </div>

 <div className="mt-5 space-y-3">
 <p className="text-3xl font-semibold tracking-tight text-[#1f1b18] ">
 {formatPriceNgn(product.price)}
 </p>
 <p className="text-xs uppercase tracking-[0.28em] text-[#94867a] ">Available sizes</p>
 {product.sizes.length > 0 ? (
 <div className="flex flex-wrap items-center justify-center gap-2">
 {product.sizes.map((size) => {
 const isSelected = selectedSize === size;

 return (
 <button
 key={`${product.slug}-${size}`}
 type="button"
 onClick={() => setSelectedSize(size)}
 className={`min-w-11 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
 isSelected
 ? "border-[#1f1b18] bg-[#1f1b18] text-white shadow-sm "
 : "border-black/15 bg-white text-[#4f4841] hover:border-black/35 hover:bg-black/[0.03] "
 }`}
 aria-pressed={isSelected}
 >
 {size}
 </button>
 );
 })}
 </div>
 ) : (
 <p className="text-sm text-[#7c736b] ">One tailored size set is available.</p>
 )}
 {selectedSize ? (
 <p className="text-xs uppercase tracking-[0.22em] text-[#8a7a6d] ">
 Selected size: {selectedSize}
 </p>
 ) : null}
 </div>
 </CardContent>

 <CardFooter className="mt-auto p-4 pt-0 sm:p-5 sm:pt-0">
 <Link href={`/products/${product.slug}`} className="w-full">
 <Button className="w-full rounded-full">View Product</Button>
 </Link>
 </CardFooter>
 </Card>
 );
}
