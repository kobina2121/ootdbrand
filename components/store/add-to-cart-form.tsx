"use client";

import { useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/components/store/cart-provider";
import { getVariantPrice, type Product } from "@/lib/products";

type AddToCartFormProps = {
 product: Product;
 sku?: string;
 onSkuChange?: (sku: string) => void;
 hideVariantSelect?: boolean;
 centered?: boolean;
};

export function AddToCartForm({
 product,
 sku,
 onSkuChange,
 hideVariantSelect = false,
 centered = false,
}: AddToCartFormProps) {
 const firstAvailableSku = useMemo(
 () => product.variants.find((entry) => entry.stock > 0)?.sku ?? product.variants[0]?.sku ?? "",
 [product.variants],
 );
 const [internalSku, setInternalSku] = useState(firstAvailableSku);
 const [quantity, setQuantity] = useState<number | "">(1);
 const previousQuantityRef = useRef(1);
 const quantityInputId = useId();
 const { addItem, userRole } = useCart();
 const isAdminUser = userRole === "admin";
 const activeSku = sku ?? internalSku;
 const setSku = (nextSku: string) => {
 if (typeof sku === "undefined") {
 setInternalSku(nextSku);
 }

 onSkuChange?.(nextSku);
 };

 const variant = useMemo(
 () => product.variants.find((entry) => entry.sku === activeSku),
 [activeSku, product.variants],
 );
 const unitPrice = getVariantPrice(product, activeSku);

 if (!variant) {
 return null;
 }

 const variantInStock = variant.stock > 0;
 const stockLimit = Math.max(1, variant.stock);
 const selectedProductName = variant.name?.trim() || product.name;
 const requestedQuantity = quantity === "" ? 1 : quantity;
 const safeQuantity = Math.min(stockLimit, Math.max(1, requestedQuantity));
 const normalizedQuantity = quantity === "" ? "" : safeQuantity;

 const updateQuantity = (nextQuantity: number) => {
 const clampedQuantity = Math.min(stockLimit, Math.max(1, nextQuantity));
 previousQuantityRef.current = clampedQuantity;
 setQuantity(clampedQuantity);
 };

 const onAddToCart = async () => {
 if (isAdminUser) {
 toast.error("Admin accounts cannot place store orders.");
 return;
 }

 if (!variantInStock) {
 toast.error("This variant is out of stock.");
 return;
 }

 const quantityToAdd = Math.min(stockLimit, Math.max(1, quantity === "" ? previousQuantityRef.current : quantity));

 try {
 await addItem({
 slug: product.slug,
 name: selectedProductName,
 image: variant.image ?? product.image,
 sku: variant.sku,
 size: variant.size,
 color: variant.color,
 unitPrice,
 quantity: quantityToAdd,
 });

 toast.success("Added to cart", {
 description: `${quantityToAdd} × ${selectedProductName} · ${variant.size} / ${variant.color}`,
 });
 } catch (error) {
 const message = error instanceof Error ? error.message : "Could not add item to cart.";
 toast.error(message);
 }
 };

 return (
 <div className={`space-y-4 ${centered ? "mx-auto flex w-full max-w-[24rem] flex-col items-center" : ""}`}>
 <div
 className={`grid gap-3 ${centered ? "w-full justify-items-center" : ""} ${
 hideVariantSelect ? "" : "sm:grid-cols-2"
 }`}
 >
 {hideVariantSelect ? null : (
 <div className={centered ? "w-full text-center sm:text-left" : ""}>
 <p className="mb-2 text-sm font-medium text-[#1f1b18] ">Variant</p>
 <Select value={activeSku} onValueChange={(value) => setSku(value ?? product.variants[0]?.sku ?? "")}>
 <SelectTrigger className="h-11 rounded-xl border-black/15 bg-white ">
 <SelectValue placeholder="Select variant" />
 </SelectTrigger>
 <SelectContent className=" ">
 {product.variants.map((entry) => (
 <SelectItem key={entry.sku} value={entry.sku}>
 {entry.name?.trim() ? `${entry.name} · ` : ""}
 {entry.size} · {entry.color}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 )}

 <div className={centered ? "flex w-full flex-col items-center text-center" : ""}>
 <label htmlFor={quantityInputId} className="mb-2 text-sm font-medium text-[#1f1b18] ">
 Quantity
 </label>
 <div className={`flex items-center gap-2 ${centered ? "justify-center" : ""}`}>
 <Button
 type="button"
 variant="outline"
 size="icon"
 className="h-11 w-11 rounded-full border-black/15 bg-white"
 onClick={() => updateQuantity(safeQuantity - 1)}
 disabled={!variantInStock || safeQuantity <= 1}
 aria-label="Decrease quantity"
 >
 -
 </Button>
 <Input
 id={quantityInputId}
 type="number"
 min={1}
 max={stockLimit}
 value={normalizedQuantity}
 disabled={!variantInStock}
 onChange={(event) => {
 const nextValue = event.target.value;
 if (nextValue === "") {
 setQuantity("");
 return;
 }

 updateQuantity(Number(nextValue) || 1);
 }}
 onFocus={() => {
 if (quantity !== "") {
 previousQuantityRef.current = quantity;
 }

 setQuantity("");
 }}
 onBlur={() => {
 if (quantity === "") {
 updateQuantity(previousQuantityRef.current);
 }
 }}
 className={`h-11 rounded-xl border-black/15 bg-white text-center ${
 centered ? "mx-auto w-28" : "w-28"
 }`}
 />
 <Button
 type="button"
 variant="outline"
 size="icon"
 className="h-11 w-11 rounded-full border-black/15 bg-white"
 onClick={() => updateQuantity(safeQuantity + 1)}
 disabled={!variantInStock || safeQuantity >= variant.stock}
 aria-label="Increase quantity"
 >
 +
 </Button>
 </div>
 {!variantInStock ? <p className="mt-2 text-xs text-red-700">This option is out of stock.</p> : null}
 </div>
 </div>

 <Button
 size="lg"
 className={`h-11 rounded-full ${centered ? "mx-auto flex w-full max-w-[19rem]" : "w-full sm:w-auto"}`}
 onClick={onAddToCart}
 disabled={isAdminUser || !variantInStock}
 >
 {isAdminUser
 ? "Admin cannot add to cart"
 : !variantInStock
 ? "Out of stock"
 : `Add ${safeQuantity} to Cart · ${new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(unitPrice * safeQuantity)}`}
 </Button>
 </div>
 );
}
