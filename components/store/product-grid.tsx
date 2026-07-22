"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/components/store/cart-provider";
import { encodeProductSlugForPath } from "@/lib/product-slug";
import { formatPriceNgn } from "@/lib/products";

type ProductVariant = {
 name?: string;
 size: string;
 color: string;
 colorCode?: string;
 image?: string;
 sku: string;
 stock: number;
 priceOverride?: number;
};

type Product = {
 slug: string;
 name: string;
 category: string;
 image: string;
 price: number;
 sizes: string[];
 colors?: Array<{
 name: string;
 code?: string;
 }>;
 description?: string;
 rating?: number;
 reviewCount?: number;
 variants?: ProductVariant[];
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
 const { addItem, userRole } = useCart();
 const [selectedColor, setSelectedColor] = useState("");
 const [selectedSize, setSelectedSize] = useState("");
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
 return product.sizes.map((size) => ({ size, inStock: true }));
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

 const handleQuickAdd = async () => {
 if (!selectedVariant) {
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
 await addItem({
 slug: product.slug,
 name: selectedProductName,
 image: selectedVariant.image ?? product.image,
 sku: selectedVariant.sku,
 size: selectedVariant.size,
 color: selectedVariant.color,
 unitPrice: selectedVariant.priceOverride ?? product.price,
 quantity: 1,
 });

 toast.success("Added to cart", {
 description: `${selectedProductName} · ${selectedVariant.size} / ${selectedVariant.color}`,
 });
 } catch (error) {
 const message = error instanceof Error ? error.message : "Could not add item to cart.";
 toast.error(message);
 }
 };

 return (
 <Card className="group hover-lift flex h-full flex-col overflow-hidden rounded-2xl border-black/10 bg-white/95 shadow-[0_16px_40px_rgba(15,12,10,0.06)] sm:rounded-3xl">
 <CardHeader className="space-y-4 p-3 sm:p-5">
 <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#f5f0ea] ">
 <Image
 src={previewImage}
 alt={selectedColor ? `${product.name} in ${selectedColor}` : product.name}
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
 {colorOptions.length > 0 ? (
 <div className="space-y-2">
 <p className="text-[0.8rem] uppercase tracking-[0.16em] text-[#5f5954] ">Available colors</p>
 <div className="flex flex-wrap items-center justify-center gap-2">
 {colorOptions.map((color) => {
 const isSelected = selectedColor === color.name;

 return (
 <button
 key={`${product.slug}-${color.name}-${color.code ?? "color"}`}
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
 className={`inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white p-1 transition ${
 isSelected ? "border-black ring-2 ring-black/15" : "border-black/20 hover:border-black/50"
 }`}
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
 <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#1f1b18]">Selected: {selectedColor}</p>
 ) : null}
 </div>
 ) : null}
 <p className="text-[0.8rem] uppercase tracking-[0.16em] text-[#5f5954] ">Available sizes</p>
 {availableSizes.length > 0 ? (
 <div className="flex flex-wrap items-center justify-center gap-2">
 {availableSizes.map(({ size, inStock }) => {
 const isSelected = selectedSize === size;

 return (
 <button
 type="button"
 key={`${product.slug}-${size}`}
 onClick={() => setSelectedSize(size)}
 disabled={Boolean(selectedColor) && !inStock}
 aria-pressed={isSelected}
 className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 py-2 text-xs font-medium transition ${
 isSelected
 ? "border-black bg-black text-white"
 : Boolean(selectedColor) && !inStock
 ? "border-red-200 bg-red-50 text-red-700 opacity-60"
 : "border-black/15 bg-white text-[#4f4841] hover:border-black/40"
 }`}
 >
 {size}
 </button>
 );
 })}
 </div>
 ) : (
 <p className="text-sm text-[#7c736b] ">One tailored size set is available.</p>
 )}
 </div>
 </CardContent>

 <CardFooter className="mt-auto grid grid-cols-[1fr_auto] gap-2 p-4 pt-0 sm:p-5 sm:pt-0">
 <Link href={`/products/${encodeProductSlugForPath(product.slug)}`} className="w-full">
 <Button className="w-full rounded-full">View Product</Button>
 </Link>
 {showQuickAdd ? (
 <Button
 type="button"
 size="icon"
 variant={selectedVariantInStock && userRole !== "admin" ? "default" : "outline"}
 className="h-10 w-10 rounded-full"
 onClick={handleQuickAdd}
 disabled={!selectedVariantInStock || userRole === "admin"}
 aria-label={
 selectedVariantInStock ? `Add ${product.name} ${selectedSize} ${selectedColor} to cart` : "Selected option is out of stock"
 }
 title={selectedVariantInStock ? "Add to cart" : "Out of stock"}
 >
 <ShoppingCart className="size-4" />
 </Button>
 ) : null}
 </CardFooter>
 </Card>
 );
}
