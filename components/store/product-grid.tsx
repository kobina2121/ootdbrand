"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, LoaderCircle, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/components/store/cart-provider";
import { encodeProductSlugForPath } from "@/lib/product-slug";
import { cn } from "@/lib/utils";
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
 sizes?: string[];
 colors?: Array<{
 name: string;
 code?: string;
 }>;
 rating?: number;
 reviewCount?: number;
 variants?: ProductVariant[];
};

export function ProductGrid({ products, className }: { products: Product[]; className?: string }) {
 return (
 <div className={cn("grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 lg:grid-cols-3 lg:gap-y-14", className)}>
 {products.map((product) => (
 <ProductCard key={product.slug} product={product} />
 ))}
 </div>
 );
}

function ProductCard({ product }: { product: Product }) {
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
 unitPrice: selectedVariant.priceOverride ?? product.price,
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
 <Card className="group flex h-full flex-col gap-0 overflow-hidden bg-transparent py-0 ring-0">
 <CardHeader className="p-0">
 <div className="relative aspect-[3/4] overflow-hidden bg-[#e9e4da]">
 <Image
 src={previewImage}
 alt={selectedColor ? `${product.name} in ${selectedColor}` : product.name}
 width={900}
 height={900}
 sizes="(max-width: 1023px) 50vw, 33vw"
 className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
 />
 </div>
 </CardHeader>

 <CardContent className="flex flex-1 flex-col items-start px-0 pt-3 pb-3 text-left">
 <p className="text-[0.68rem] tracking-[0.22em] text-[#5f5954] uppercase">{product.category}</p>

 <div className="mt-1">
 <CardTitle className="font-heading text-2xl leading-tight font-normal text-[#1d1b1a] sm:text-3xl">{product.name}</CardTitle>
 </div>

 <div className="mt-2 flex flex-col items-start gap-0.5">
 <p className="text-xs tracking-wide text-[#a47531] sm:text-sm">
 {reviewCount > 0 ? (
 <>
 {"★★★★★"} <span className="font-medium">({rating.toFixed(1)})</span>
 </>
 ) : (
 <span className="text-[#7c736b]">No ratings yet</span>
 )}
 </p>
 <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[#5f5954]">
 {reviewCount} review{reviewCount === 1 ? "" : "s"}
 </p>
 </div>

 <div className="mt-3 space-y-3">
 <p className="text-lg font-medium text-[#1d1b1a] sm:text-xl">
 {formatPriceNgn(product.price)}
 </p>
 {colorOptions.length > 0 ? (
 <div className="space-y-2">
 <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[#5f5954]">Available colors</p>
 <div className="flex flex-wrap items-center justify-start gap-1.5 sm:gap-2">
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
 className={`inline-flex h-9 w-9 items-center justify-center rounded-full border bg-[#fbf9f4] p-1 transition ${
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
 <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[#5f5954]">Available sizes</p>
 {availableSizes.length > 0 ? (
 <div className="flex flex-wrap items-center justify-start gap-1.5 sm:gap-2">
 {availableSizes.map(({ size, inStock }) => {
 const isSelected = selectedSize === size;

 return (
 <button
 type="button"
 key={`${product.slug}-${size}`}
 onClick={() => setSelectedSize(size)}
 disabled={Boolean(selectedColor) && !inStock}
 aria-pressed={isSelected}
 className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-none border px-3 py-2 text-xs font-medium transition ${
 isSelected
 ? "border-black bg-black text-white"
 : Boolean(selectedColor) && !inStock
 ? "border-red-200 bg-red-50 text-red-700 opacity-60"
 : "border-black/20 bg-transparent text-[#4f4841] hover:border-black/60"
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

 <CardFooter className="mt-auto grid grid-cols-[1fr_auto] gap-2 border-t-0 bg-transparent p-0">
 <Link href={`/products/${encodeProductSlugForPath(product.slug)}`} className="w-full">
 <Button variant="outline" className="w-full rounded-none border-[#1d1b1a] bg-transparent hover:bg-[#1d1b1a] hover:text-[#f6f2ea]">View Product</Button>
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
 {isSelectedVariantInCart ? (
 <p className="col-span-2 text-left text-xs font-medium uppercase tracking-[0.14em] text-emerald-700">
 In cart · {cartItem?.quantity ?? 1}
 </p>
 ) : null}
 </CardFooter>
 </Card>
 );
}
