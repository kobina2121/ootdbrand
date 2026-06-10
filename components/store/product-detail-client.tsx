"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { AddToCartForm } from "@/components/store/add-to-cart-form";
import { Badge } from "@/components/ui/badge";
import { type Product } from "@/lib/products";

type ProductDetailClientProps = {
 product: Product;
};

export function ProductDetailClient({ product }: ProductDetailClientProps) {
 const baseImages = useMemo(() => {
 const uploaded = product.images?.filter(Boolean) ?? [];
 return uploaded.length > 0 ? uploaded : [product.image].filter(Boolean);
 }, [product.image, product.images]);

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
 const galleryImages = useMemo(() => {
 const ordered = [
 selectedVariant?.image,
 ...variantsForColor.map((variant) => variant.image),
 ...baseImages,
 product.image,
 ].filter((value): value is string => Boolean(value));

 return Array.from(new Set(ordered));
 }, [baseImages, product.image, selectedVariant?.image, variantsForColor]);

 const [selectedImage, setSelectedImage] = useState<string>(firstVariant?.image ?? galleryImages[0] ?? product.image);

 return (
 <div className="grid gap-8 rounded-3xl border border-black/10 bg-white/85 p-4 shadow-sm lg:grid-cols-[1.15fr_0.85fr] lg:p-6">
 <div className="space-y-4">
 <div className="relative overflow-hidden rounded-[1.75rem] border border-black/5 bg-[#f7f1eb] shadow-[0_18px_44px_rgba(20,17,15,0.08)] ">
 <Image
 src={selectedImage}
 alt={product.name}
 width={1200}
 height={1440}
 unoptimized
 className="h-[520px] w-full object-cover object-center lg:h-[620px]"
 />
 </div>

 {galleryImages.length > 1 ? (
 <div className="flex flex-wrap justify-center gap-3">
 {galleryImages.map((image, index) => {
 const isActive = image === selectedImage;

 return (
 <button
 key={`${image}-${index}`}
 type="button"
 onClick={() => setSelectedImage(image)}
 className={`group relative w-[7.25rem] overflow-hidden rounded-2xl border bg-[#f7f1eb] transition-all sm:w-[7.75rem] ${
 isActive
 ? "border-black shadow-[0_10px_25px_rgba(20,17,15,0.14)] "
 : "border-black/10 hover:border-black/30 "
 }`}
 aria-label={`View image ${index + 1} of ${galleryImages.length}`}
 aria-pressed={isActive}
 >
 <Image
 src={image}
 alt={`${product.name} preview ${index + 1}`}
 width={220}
 height={260}
 unoptimized
 className="h-24 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
 />
 </button>
 );
 })}
 </div>
 ) : null}
 </div>

 <section className="mx-auto flex w-full max-w-[34rem] flex-col items-center space-y-5 text-center">
 <Badge
 variant={inStock ? "default" : "destructive"}
 className="mx-auto rounded-full "
 >
 {inStock ? "In Stock" : "Out of Stock"}
 </Badge>

 <h1 className="max-w-[14ch] font-heading text-5xl leading-none text-[#1f1b18] sm:max-w-[13ch]">
 {product.name}
 </h1>
 <p className="max-w-[28rem] text-sm text-[#6c655f] sm:text-base">{product.description}</p>

 <div className="space-y-3">
 <p className="text-sm tracking-[0.18em] text-muted-foreground ">SELECT COLOR</p>
 <div className="flex flex-wrap justify-center gap-2">
 {colorOptions.map((colorOption) => (
 <button
 key={`color-${colorOption.name}`}
 type="button"
 className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
 selectedColor === colorOption.name
 ? "border-black bg-black text-white shadow-sm "
 : "border-black/20 bg-white text-black hover:border-black/40 "
 }`}
 onClick={() => {
 setSelectedColor(colorOption.name);
 const firstSizeForColor = product.variants.find((variant) => variant.color === colorOption.name)?.size;
 const firstImageForColor = product.variants.find((variant) => variant.color === colorOption.name)?.image;
 if (firstSizeForColor) {
 setSelectedSize(firstSizeForColor);
 }
 setSelectedImage(firstImageForColor ?? product.images?.[0] ?? product.image);
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
 {selectedColor ? (
 <p className="text-sm text-[#6c655f] ">
 Selected color: <span className="font-medium text-[#1f1b18] ">{selectedColor}</span>
 </p>
 ) : null}
 </div>

 <div className="space-y-3">
 <p className="text-sm tracking-[0.18em] text-muted-foreground ">AVAILABLE SIZES</p>
 <div className="flex flex-wrap justify-center gap-2">
 {availableSizes.map((size) => (
 <button
 key={`size-${size}`}
 type="button"
 className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition ${
 selectedSize === size
 ? "border-black bg-black text-white shadow-sm "
 : "border-black/20 bg-white text-black hover:border-black/40 "
 }`}
 onClick={() => setSelectedSize(size)}
 >
 {size}
 </button>
 ))}
 </div>
 </div>

 <p className="text-2xl font-semibold text-[#1f1b18] ">
 {new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(
 product.basePrice,
 )}
 </p>

 {inStock && selectedVariant ? (
 <AddToCartForm product={product} sku={selectedVariant.sku} hideVariantSelect centered />
 ) : (
 <p className="text-sm text-muted-foreground">This item is currently unavailable.</p>
 )}
 </section>
 </div>
 );
}
