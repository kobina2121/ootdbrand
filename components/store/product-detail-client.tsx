"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { AddToCartForm } from "@/components/store/add-to-cart-form";
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

 const firstVariant = product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];
 const [selectedColor, setSelectedColor] = useState(firstVariant?.color ?? "");
 const [selectedSize, setSelectedSize] = useState(firstVariant?.size ?? "");
 const [hasSelectedVariant, setHasSelectedVariant] = useState(false);

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

 const selectedVariantInStock = Boolean(selectedVariant && selectedVariant.stock > 0);
 const showSelectedStatus = hasSelectedVariant && selectedVariant;
 const galleryImages = useMemo(() => {
 const ordered = [
 selectedVariant?.image,
 ...product.variants.map((variant) => variant.image),
 ...baseImages,
 product.image,
 ].filter((value): value is string => Boolean(value));

 return Array.from(new Set(ordered));
 }, [baseImages, product.image, product.variants, selectedVariant?.image]);

 const [selectedImage, setSelectedImage] = useState<string>(firstVariant?.image ?? galleryImages[0] ?? product.image);
 const selectImage = (image: string) => {
 setSelectedImage(image);
 const imageVariant =
 product.variants.find((variant) => variant.image === image && variant.stock > 0) ??
 product.variants.find((variant) => variant.image === image);

 if (!imageVariant) {
 return;
 }

 setHasSelectedVariant(true);
 setSelectedColor(imageVariant.color);
 setSelectedSize(imageVariant.size);
 };

 return (
	 <div className="grid gap-5 rounded-2xl border border-black/10 bg-white/85 p-3 shadow-sm sm:gap-8 sm:rounded-3xl sm:p-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:p-6">
	 <div className="space-y-4">
	 <div className="relative overflow-hidden rounded-2xl border border-black/5 bg-[#f7f1eb] shadow-[0_18px_44px_rgba(20,17,15,0.08)] sm:rounded-[1.75rem]">
	 <Image
	 src={selectedImage}
	 alt={product.name}
	 width={1200}
	 height={1440}
	 unoptimized
	 className="h-[min(62svh,460px)] min-h-[280px] w-full object-cover object-center sm:h-[min(72svh,520px)] sm:min-h-[340px] lg:h-[620px]"
	 />
	 </div>

 {galleryImages.length > 1 ? (
	 <div className="flex flex-nowrap justify-start gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:gap-3">
 {galleryImages.map((image, index) => {
 const isActive = image === selectedImage;

 return (
 <button
 key={`${image}-${index}`}
 type="button"
 onClick={() => selectImage(image)}
	 className={`group relative w-[5.75rem] shrink-0 overflow-hidden rounded-xl border bg-[#f7f1eb] transition-all sm:w-[7.75rem] sm:rounded-2xl ${
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
	 className="h-20 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] sm:h-24"
 />
 </button>
 );
 })}
 </div>
 ) : null}
 </div>

	 <section className="mx-auto flex w-full max-w-[34rem] flex-col items-center space-y-4 text-center sm:space-y-5">
	 <h1 className="max-w-[14ch] font-heading text-4xl leading-none text-[#1f1b18] sm:max-w-[13ch] sm:text-5xl">
 {product.name}
 </h1>
 <p className="max-w-[28rem] text-sm text-[#6c655f] sm:text-base">{product.description}</p>

 <div className="space-y-3">
 <p className="text-sm tracking-[0.18em] text-muted-foreground ">SELECT COLOR</p>
 <div className="flex flex-wrap justify-center gap-2">
 {colorOptions.map((colorOption) => {
 const colorIsSelected = selectedColor === colorOption.name;

 return (
 <button
 key={`color-${colorOption.name}`}
 type="button"
 className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
 colorIsSelected
 ? "border-black bg-black text-white shadow-sm "
 : "border-black/20 bg-white text-black hover:border-black/40 "
 }`}
 onClick={() => {
 setHasSelectedVariant(true);
 setSelectedColor(colorOption.name);
 const firstVariantForColor =
 product.variants.find((variant) => variant.color === colorOption.name && variant.stock > 0) ??
 product.variants.find((variant) => variant.color === colorOption.name);
 const firstSizeForColor = firstVariantForColor?.size;
 const firstImageForColor = firstVariantForColor?.image;
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
 <span className="flex flex-col items-start leading-tight">
 <span>{colorOption.name}</span>
 </span>
 </button>
 );
 })}
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
 {availableSizes.map((size) => {
 const sizeVariant = variantsForColor.find((variant) => variant.size === size);
 const isSelectedSize = selectedSize === size;
 const isSizeInStock = Boolean(sizeVariant && sizeVariant.stock > 0);

 return (
 <button
 key={`size-${size}`}
 type="button"
 className={`inline-flex min-h-12 min-w-16 flex-col items-center justify-center rounded-2xl border px-4 py-2 text-sm font-medium leading-tight transition ${
 isSelectedSize && hasSelectedVariant && !isSizeInStock
 ? "border-red-600 bg-red-50 text-red-700 shadow-sm "
 : isSelectedSize
 ? "border-black bg-black text-white shadow-sm "
 : "border-black/20 bg-white text-black hover:border-black/40 "
 }`}
 onClick={() => {
 setHasSelectedVariant(true);
 setSelectedSize(size);
 }}
 aria-pressed={isSelectedSize}
 aria-label={`${size} ${isSizeInStock ? "in stock" : "out of stock"}`}
 >
 <span>{size}</span>
 </button>
 );
 })}
 </div>
 </div>

 <p className="text-2xl font-semibold text-[#1f1b18] ">
 {new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(
 product.basePrice,
 )}
 </p>

 {showSelectedStatus ? (
 <div
 className={`w-full max-w-[23rem] rounded-2xl border px-4 py-3 text-sm ${
 selectedVariantInStock
 ? "border-green-200 bg-green-50 text-green-700"
 : "border-red-200 bg-red-50 text-red-700"
 }`}
 >
 <p className="font-semibold">
 {selectedVariantInStock ? "Selected option is available" : "Selected option is out of stock"}
 </p>
 <p className="mt-1 text-xs text-muted-foreground">
 {selectedVariant.size} / {selectedVariant.color}
 </p>
 </div>
 ) : null}

 {selectedVariant ? (
 <AddToCartForm product={product} sku={selectedVariant.sku} hideVariantSelect centered />
 ) : (
 <p className="text-sm text-muted-foreground">This item is currently unavailable.</p>
 )}
 </section>
 </div>
 );
}
