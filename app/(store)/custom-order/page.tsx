"use client";

import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Clock3, CreditCard, ImagePlus, MapPin, Ruler, Shirt, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/components/store/cart-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buildImageBlobPath } from "@/lib/blob-upload";
import { calculateCustomOrderTotal, resolveTransactionFeeGhs } from "@/lib/custom-order-pricing";
import { formatPriceNgn } from "@/lib/products";

const typeOptions = ["Dress", "Top", "Skirt", "Set", "Jumpsuit"] as const;
const customOrderFieldLabels = {
 product: "Product",
 name: "Full name",
 email: "Email",
 phone: "Telephone number",
 preferredSize: "Size",
 preferredColor: "Color",
 bustSize: "Bust size",
 waistSize: "Waist size",
 hipSize: "Hip size",
 addressLine: "Street address",
 city: "City",
 stateRegion: "State / Region",
 country: "Country",
} as const;

type CustomOrderFieldName = keyof typeof customOrderFieldLabels;

type DeliveryAddress = {
 addressLine: string;
 city: string;
 stateRegion: string;
 country: string;
};

type CatalogVariant = {
 sku: string;
 size: string;
 color: string;
 colorCode: string;
 image: string;
 price: number;
 stock: number;
};

type CatalogProduct = {
 slug: string;
 name: string;
 category: string;
 description: string;
 basePrice: number;
 image: string;
 variants: CatalogVariant[];
};

export default function CustomOrderPage() {
 const { userRole } = useCart();
 const searchParams = useSearchParams();
 const preferredProductSlug = searchParams.get("product")?.toLowerCase() ?? "";

 const [products, setProducts] = useState<CatalogProduct[]>([]);
 const [isCatalogLoading, setIsCatalogLoading] = useState(true);
 const [selectedCategory, setSelectedCategory] = useState("");
 const [selectedProductSlug, setSelectedProductSlug] = useState("");
 const [preferredColor, setPreferredColor] = useState("");
 const [preferredSize, setPreferredSize] = useState("");
 const [bustSize, setBustSize] = useState("");
 const [waistSize, setWaistSize] = useState("");
 const [hipSize, setHipSize] = useState("");
 const [additionalMeasurements, setAdditionalMeasurements] = useState("");
 const [customizationFee, setCustomizationFee] = useState(0);
 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [phone, setPhone] = useState("");
 const [paymentMethod, setPaymentMethod] = useState<"card" | "mobile_money">("card");
 const [type, setType] = useState("");
 const [notes, setNotes] = useState("");
 const [photoFiles, setPhotoFiles] = useState<File[]>([]);
 const [fieldErrors, setFieldErrors] = useState<Partial<Record<CustomOrderFieldName, string>>>({});
 const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
 addressLine: "",
 city: "",
 stateRegion: "",
 country: "Ghana",
 });
 const [isSubmitting, setIsSubmitting] = useState(false);

 const selectedProduct = useMemo(
 () => products.find((product) => product.slug === selectedProductSlug) ?? null,
 [products, selectedProductSlug],
 );

 const categories = useMemo(
 () => Array.from(new Set(products.map((product) => product.category))),
 [products],
 );

 const filteredProducts = useMemo(() => {
 if (!selectedCategory) {
 return [];
 }

 return products.filter((product) => product.category === selectedCategory);
 }, [products, selectedCategory]);

 const selectedProductUnitPrice = selectedProduct?.basePrice ?? 0;
 const transactionFee = resolveTransactionFeeGhs();
 const selectedCustomOrderTotal = calculateCustomOrderTotal(selectedProductUnitPrice, customizationFee, transactionFee);
 const getFieldErrorProps = (field: CustomOrderFieldName) => ({
 "aria-invalid": Boolean(fieldErrors[field]),
 "aria-describedby": fieldErrors[field] ? `custom-order-${field}-error` : undefined,
 });

 const clearFieldError = (field: CustomOrderFieldName) => {
 setFieldErrors((previous) => {
 if (!previous[field]) {
 return previous;
 }

 const next = { ...previous };
 delete next[field];
 return next;
 });
 };

 const photoPreviews = useMemo(
 () =>
 photoFiles.map((file) => ({
 name: file.name,
 url: URL.createObjectURL(file),
 })),
 [photoFiles],
 );

 useEffect(() => {
 return () => {
 photoPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
 };
 }, [photoPreviews]);

 useEffect(() => {
 let isMounted = true;

 const loadCatalog = async () => {
 setIsCatalogLoading(true);
 try {
 const response = await fetch("/api/products/custom-catalog", { cache: "no-store" });
 const json = (await response.json()) as {
 ok: boolean;
 data?: { products?: CatalogProduct[]; customizationFee?: number };
 message?: string;
 };

 if (!response.ok || !json.ok || !json.data?.products?.length) {
 throw new Error(json.message || "Could not load catalog.");
 }

 if (!isMounted) {
 return;
 }

 const catalog = json.data.products;
 setProducts(catalog);
 setCustomizationFee(json.data.customizationFee ?? 0);

 const preferred = catalog.find((entry) => entry.slug === preferredProductSlug) ?? catalog[0];

 if (preferred) {
 setSelectedCategory(preferred.category);
 setSelectedProductSlug(preferred.slug);
 }
 } catch (error) {
 if (isMounted) {
 toast.error(error instanceof Error ? error.message : "Could not load products.");
 }
 } finally {
 if (isMounted) {
 setIsCatalogLoading(false);
 }
 }
 };

 void loadCatalog();
 return () => {
 isMounted = false;
 };
 }, [preferredProductSlug]);

 const uploadReferenceImages = async () => {
 if (photoFiles.length === 0) {
 return [];
 }

 try {
 const uploadedImages: string[] = [];

 for (const file of photoFiles) {
 const blob = await upload(buildImageBlobPath("custom-orders", file.name), file, {
 access: "public",
 handleUploadUrl: "/api/uploads/custom-order-image",
 });

 uploadedImages.push(blob.url);
 }

 return uploadedImages;
 } catch {
 toast.error("Could not upload image. Continuing without image.");
 return [];
 }
 };

 const handleCategoryChange = (category: string) => {
 setSelectedCategory(category);
 const firstProduct = products.find((entry) => entry.category === category);

 if (!firstProduct) {
 setSelectedProductSlug("");
 return;
 }

 setSelectedProductSlug(firstProduct.slug);
 };

 const handleProductChange = (slug: string) => {
 setSelectedProductSlug(slug);
 const product = products.find((entry) => entry.slug === slug);
 if (!product) {
 return;
 }
 setSelectedCategory(product.category);
 };

 const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 setFieldErrors({});

 const requiredFields = {
 product: selectedProduct?.slug ?? "",
 name: name.trim(),
 email: email.trim(),
 phone: phone.trim(),
 preferredSize: preferredSize.trim(),
 preferredColor: preferredColor.trim(),
 bustSize: bustSize.trim(),
 waistSize: waistSize.trim(),
 hipSize: hipSize.trim(),
 addressLine: deliveryAddress.addressLine.trim(),
 city: deliveryAddress.city.trim(),
 stateRegion: deliveryAddress.stateRegion.trim(),
 country: deliveryAddress.country.trim(),
 } satisfies Record<CustomOrderFieldName, string>;
 const nextFieldErrors = Object.fromEntries(
 (Object.entries(requiredFields) as Array<[CustomOrderFieldName, string]>)
 .filter(([, value]) => value.length === 0)
 .map(([field]) => [field, `${customOrderFieldLabels[field]} is required.`]),
 ) as Partial<Record<CustomOrderFieldName, string>>;

 if (Object.keys(nextFieldErrors).length > 0) {
 setFieldErrors(nextFieldErrors);
 toast.error("Please complete the highlighted required fields.");
 return;
 }
 const productToOrder = selectedProduct;

 if (!productToOrder) {
 setFieldErrors({ product: "Product is required." });
 toast.error("Please select a product.");
 return;
 }

 setIsSubmitting(true);

 try {
 const referenceImages = await uploadReferenceImages();
 const response = await fetch("/api/custom-order/init", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 },
 body: JSON.stringify({
 productSlug: productToOrder.slug,
 fullName: name.trim(),
 email: email.trim(),
 phone: phone.trim(),
 paymentMethod,
 type: type.trim() || undefined,
 preferredSize: preferredSize.trim(),
 preferredColor: preferredColor.trim(),
 bustSize: bustSize.trim(),
 waistSize: waistSize.trim(),
 hipSize: hipSize.trim(),
 additionalMeasurements: additionalMeasurements.trim() || undefined,
 notes: notes.trim() || undefined,
 referenceImage: referenceImages[0],
 referenceImages,
 deliveryAddress: {
 addressLine: deliveryAddress.addressLine.trim(),
 city: deliveryAddress.city.trim(),
 stateRegion: deliveryAddress.stateRegion.trim(),
 country: deliveryAddress.country.trim(),
 },
 }),
 });

 const json = (await response.json()) as {
 ok: boolean;
 message: string;
 data: { authorizationUrl?: string };
 };

 if (!response.ok || !json.ok || !json.data.authorizationUrl) {
 throw new Error(json.message || "Could not initialize custom order payment.");
 }

 window.location.assign(json.data.authorizationUrl);
 } catch (error) {
 const message = error instanceof Error ? error.message : "Could not initialize custom order payment.";
 toast.error(message);
 } finally {
 setIsSubmitting(false);
 }
 };

 if (userRole === "admin") {
 return (
 <Card className="mx-auto w-full max-w-2xl rounded-3xl border-black/10 bg-white/90 text-center shadow-sm ">
 <CardHeader>
 <CardTitle className="font-heading text-5xl leading-none text-[#1f1b18] ">Custom Orders Disabled for Admin</CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 <p className="text-sm text-muted-foreground">Admin accounts cannot place customer custom orders.</p>
 <Button className="rounded-full" onClick={() => window.location.assign("/admin/custom-orders")}>
 Go to Custom Order Admin
 </Button>
 </CardContent>
 </Card>
 );
 }

 return (
 <div className="mx-auto w-full max-w-4xl space-y-4">
 <Card className="border-black/10 bg-[#f4f3ef] shadow-sm ">
 <CardContent className="flex items-start gap-3 p-4 sm:p-5">
 <Clock3 className="mt-0.5 size-5 text-[#3f3a35] " />
 <div>
 <p className="text-sm font-medium text-[#1f1b18] ">Production timeline</p>
 <p className="text-sm text-[#6b655f] ">Custom orders take 7-14 business days to complete.</p>
 </div>
 </CardContent>
 </Card>

 <Card className="border-black/10 bg-white/90 shadow-sm ">
 <CardHeader>
 <p className="form-section-title">Custom Atelier</p>
 <CardTitle className="font-heading text-3xl text-[#1f1b18] ">Customize From Catalog</CardTitle>
 <p className="text-sm text-[#6b655f] ">
 Choose a shop product first, then customize it. Product name, price, images, and specs auto-fill from catalog.
 </p>
 </CardHeader>
 <CardContent>
 <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
 <div className="space-y-4 rounded-2xl border border-black/10 bg-[#faf9f7] p-4 sm:p-5">
 <p className="form-section-title">Selected Product *</p>
 <div className="space-y-2">
 <label htmlFor="custom-order-category" className="text-sm font-medium text-[#1f1b18] ">
 Category *
 </label>
 <select
 id="custom-order-category"
 className="h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm text-[#1f1b18] "
 value={selectedCategory}
 disabled={isCatalogLoading}
 onChange={(event) => handleCategoryChange(event.target.value)}
 >
 {isCatalogLoading ? <option>Loading categories...</option> : null}
 {!isCatalogLoading ? (
 <>
 <option value="" disabled>
 Select a category
 </option>
 {categories.map((category) => (
 <option key={category} value={category}>
 {category}
 </option>
 ))}
 </>
 ) : null}
 </select>
 </div>

 <div className="space-y-2">
 <label htmlFor="custom-order-product" className="text-sm font-medium text-[#1f1b18] ">
 Product *
 </label>
 <select
 id="custom-order-product"
 className="h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm text-[#1f1b18] "
 value={selectedProductSlug}
 disabled={isCatalogLoading || !selectedCategory}
 {...getFieldErrorProps("product")}
 onChange={(event) => {
 handleProductChange(event.target.value);
 clearFieldError("product");
 }}
 >
 {isCatalogLoading ? <option>Loading products...</option> : null}
 {!isCatalogLoading ? (
 <>
 <option value="" disabled>
 {selectedCategory ? "Select a product" : "Select a category first"}
 </option>
 {filteredProducts.map((product) => (
 <option key={product.slug} value={product.slug}>
 {product.name} · {formatPriceNgn(product.basePrice)}
 </option>
 ))}
 </>
 ) : null}
 </select>
 {fieldErrors.product ? (
 <p id="custom-order-product-error" className="text-sm text-destructive">
 {fieldErrors.product}
 </p>
 ) : null}
 </div>

 {selectedProduct ? (
 <div className="grid gap-3 rounded-xl border border-black/10 bg-white p-3 sm:grid-cols-[140px_1fr]">
 <Image
 src={selectedProduct.image}
 alt={selectedProduct.name}
 width={140}
 height={160}
 unoptimized
 className="h-40 w-full rounded-lg object-cover"
 />
 <div className="space-y-1">
 <p className="text-base font-semibold text-[#1f1b18] ">{selectedProduct.name}</p>
 <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{selectedProduct.category}</p>
 <p className="text-sm text-[#6b655f] ">{selectedProduct.description}</p>
 <p className="text-sm font-medium text-[#1f1b18] ">
 Product price: {formatPriceNgn(selectedProductUnitPrice)}
 </p>
 <p className="text-sm text-[#6b655f] ">
 Customization fee: {formatPriceNgn(customizationFee)}
 </p>
 <p className="text-sm text-[#6b655f] ">
 Transaction fee: {formatPriceNgn(transactionFee)}
 </p>
 <p className="text-sm font-semibold text-[#1f1b18] ">
 Total to pay: {formatPriceNgn(selectedCustomOrderTotal)}
 </p>
 <p className="text-xs text-muted-foreground">
 Custom order links directly to this product catalog pricing.
 </p>
 </div>
 </div>
 ) : null}
 </div>

 <div className="space-y-4 rounded-2xl border border-black/10 bg-[#faf9f7] p-4 sm:p-5">
 <p className="form-section-title">Customer Details</p>
 <div className="grid gap-4 sm:grid-cols-2">
 <div className="space-y-2">
 <label htmlFor="custom-order-name" className="text-sm font-medium text-[#1f1b18] ">
 Full Name *
 </label>
 <Input
 id="custom-order-name"
 value={name}
 {...getFieldErrorProps("name")}
 onChange={(event) => {
 setName(event.target.value);
 clearFieldError("name");
 }}
 placeholder="Your full name"
 className="rounded-xl border-black/15 "
 />
 {fieldErrors.name ? (
 <p id="custom-order-name-error" className="text-sm text-destructive">
 {fieldErrors.name}
 </p>
 ) : null}
 </div>
 <div className="space-y-2">
 <label htmlFor="custom-order-email" className="text-sm font-medium text-[#1f1b18] ">
 Email *
 </label>
 <Input
 id="custom-order-email"
 type="email"
 value={email}
 {...getFieldErrorProps("email")}
 onChange={(event) => {
 setEmail(event.target.value);
 clearFieldError("email");
 }}
 placeholder="you@example.com"
 className="rounded-xl border-black/15 "
 />
 {fieldErrors.email ? (
 <p id="custom-order-email-error" className="text-sm text-destructive">
 {fieldErrors.email}
 </p>
 ) : null}
 </div>
 </div>
 <div className="space-y-2">
 <label htmlFor="custom-order-phone" className="text-sm font-medium text-[#1f1b18] ">
 Telephone Number *
 </label>
 <Input
 id="custom-order-phone"
 type="tel"
 value={phone}
 {...getFieldErrorProps("phone")}
 onChange={(event) => {
 setPhone(event.target.value);
 clearFieldError("phone");
 }}
 placeholder="+233 53 647 7207"
 className="rounded-xl border-black/15 "
 />
 {fieldErrors.phone ? (
 <p id="custom-order-phone-error" className="text-sm text-destructive">
 {fieldErrors.phone}
 </p>
 ) : null}
 </div>
 </div>

 <div className="space-y-4 rounded-2xl border border-black/10 bg-[#faf9f7] p-4 sm:p-5">
 <p className="form-section-title">Customization</p>
 <div className="grid gap-4 sm:grid-cols-2">
 <div className="space-y-2">
 <label htmlFor="custom-order-type" className="text-sm font-medium text-[#1f1b18] ">
 Type
 </label>
 <select
 id="custom-order-type"
 className="h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm text-[#1f1b18] "
 value={type}
 onChange={(event) => setType(event.target.value)}
 >
 <option value="" disabled>
 Select type
 </option>
 {typeOptions.map((option) => (
 <option key={option} value={option}>
 {option}
 </option>
 ))}
 </select>
 </div>
 <div className="space-y-2">
 <label htmlFor="custom-order-selected-category" className="text-sm font-medium text-[#1f1b18] ">
 Category
 </label>
 <Input id="custom-order-selected-category" value={selectedProduct?.category ?? ""} disabled className="rounded-xl border-black/15 bg-white " />
 </div>
 </div>
 <div className="grid gap-4 sm:grid-cols-2">
 <div className="space-y-2">
 <label htmlFor="custom-order-size" className="text-sm font-medium text-[#1f1b18] ">
 Size *
 </label>
 <Input
 id="custom-order-size"
 value={preferredSize}
 {...getFieldErrorProps("preferredSize")}
 onChange={(event) => {
 setPreferredSize(event.target.value);
 clearFieldError("preferredSize");
 }}
 placeholder="e.g. XS, S, M, L, XL or custom size"
 className="rounded-xl border-black/15 "
 disabled={!selectedProduct}
 />
 {fieldErrors.preferredSize ? (
 <p id="custom-order-preferredSize-error" className="text-sm text-destructive">
 {fieldErrors.preferredSize}
 </p>
 ) : null}
 </div>
 <div className="space-y-2">
 <label htmlFor="custom-order-color" className="text-sm font-medium text-[#1f1b18] ">
 Color *
 </label>
 <Input
 id="custom-order-color"
 value={preferredColor}
 {...getFieldErrorProps("preferredColor")}
 onChange={(event) => {
 setPreferredColor(event.target.value);
 clearFieldError("preferredColor");
 }}
 placeholder="e.g. Wine, Ivory, Sage Green, Custom Mix"
 className="rounded-xl border-black/15 "
 disabled={!selectedProduct}
 />
 {fieldErrors.preferredColor ? (
 <p id="custom-order-preferredColor-error" className="text-sm text-destructive">
 {fieldErrors.preferredColor}
 </p>
 ) : null}
 </div>
 </div>
 <fieldset className="space-y-3">
 <legend className="inline-flex items-center gap-2 text-sm font-medium text-[#1f1b18] ">
 <Ruler className="size-4" />
 Body Measurements *
 </legend>
 <div className="grid gap-3 sm:grid-cols-3">
 <div className="space-y-2">
 <label htmlFor="custom-order-bust" className="sr-only">
 Bust size
 </label>
 <Input
 id="custom-order-bust"
 value={bustSize}
 {...getFieldErrorProps("bustSize")}
 onChange={(event) => {
 setBustSize(event.target.value);
 clearFieldError("bustSize");
 }}
 placeholder="Bust size (in/cm)"
 className="rounded-xl border-black/15 "
 disabled={!selectedProduct}
 />
 {fieldErrors.bustSize ? (
 <p id="custom-order-bustSize-error" className="text-sm text-destructive">
 {fieldErrors.bustSize}
 </p>
 ) : null}
 </div>
 <div className="space-y-2">
 <label htmlFor="custom-order-waist" className="sr-only">
 Waist size
 </label>
 <Input
 id="custom-order-waist"
 value={waistSize}
 {...getFieldErrorProps("waistSize")}
 onChange={(event) => {
 setWaistSize(event.target.value);
 clearFieldError("waistSize");
 }}
 placeholder="Waist size (in/cm)"
 className="rounded-xl border-black/15 "
 disabled={!selectedProduct}
 />
 {fieldErrors.waistSize ? (
 <p id="custom-order-waistSize-error" className="text-sm text-destructive">
 {fieldErrors.waistSize}
 </p>
 ) : null}
 </div>
 <div className="space-y-2">
 <label htmlFor="custom-order-hip" className="sr-only">
 Hip size
 </label>
 <Input
 id="custom-order-hip"
 value={hipSize}
 {...getFieldErrorProps("hipSize")}
 onChange={(event) => {
 setHipSize(event.target.value);
 clearFieldError("hipSize");
 }}
 placeholder="Hip size (in/cm)"
 className="rounded-xl border-black/15 "
 disabled={!selectedProduct}
 />
 {fieldErrors.hipSize ? (
 <p id="custom-order-hipSize-error" className="text-sm text-destructive">
 {fieldErrors.hipSize}
 </p>
 ) : null}
 </div>
 </div>
 <label htmlFor="custom-order-additional-measurements" className="sr-only">
 Additional measurements
 </label>
 <Textarea
 id="custom-order-additional-measurements"
 rows={3}
 value={additionalMeasurements}
 onChange={(event) => setAdditionalMeasurements(event.target.value)}
 placeholder="Additional measurements (optional): shoulder, sleeve, dress length, inseam, etc."
 className="rounded-xl border-black/15 "
 disabled={!selectedProduct}
 />
 </fieldset>
 <div className="space-y-2">
 <label htmlFor="custom-order-reference-images" className="inline-flex items-center gap-2 text-sm font-medium text-[#1f1b18] ">
 <ImagePlus className="size-4" />
 Upload Reference Images
 </label>
 <Input
 id="custom-order-reference-images"
 type="file"
 accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
 multiple
 onChange={(event) => {
 const nextFiles = Array.from(event.target.files ?? []).slice(0, 6);
 if ((event.target.files?.length ?? 0) > 6) {
 toast.error("You can upload up to 6 reference images.");
 }
 setPhotoFiles(nextFiles);
 }}
 className="rounded-xl border-black/15 "
 />
 {selectedProduct || photoPreviews.length > 0 ? (
 <div className="space-y-3">
 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
 {selectedProduct ? (
 <div className="space-y-1">
 <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
 Product image
 </p>
 <Image
 src={selectedProduct.image}
 alt={`${selectedProduct.name} product preview`}
 width={288}
 height={192}
 unoptimized
 className="h-48 w-full rounded-xl border border-black/10 object-cover "
 />
 </div>
 ) : null}
 {photoPreviews.map((preview, index) => (
 <div key={`${preview.name}-${index}`} className="space-y-1">
 <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
 Uploaded reference {index + 1}
 </p>
 <Image
 src={preview.url}
 alt={`Reference preview ${index + 1}`}
 width={288}
 height={192}
 unoptimized
 className="h-48 w-full rounded-xl border border-black/10 object-cover "
 />
 </div>
 ))}
 </div>
 <p className="text-xs text-muted-foreground">
 {photoPreviews.length > 0
 ? `${photoPreviews.length} reference image${photoPreviews.length > 1 ? "s" : ""} will be sent with this custom order.`
 : "Select one or more reference images if you want to show the exact finish you prefer."}
 </p>
 </div>
 ) : null}
 </div>
 </div>

 <div className="space-y-3 rounded-2xl border border-black/10 bg-[#faf9f7] p-4 sm:p-5">
 <p className="inline-flex items-center gap-2 text-sm font-medium text-[#1f1b18] ">
 <MapPin className="size-4" />
 Delivery Address *
 </p>
 <label htmlFor="custom-order-address-line" className="sr-only">
 Street address or house number
 </label>
 <Input
 id="custom-order-address-line"
 value={deliveryAddress.addressLine}
 {...getFieldErrorProps("addressLine")}
 onChange={(event) =>
 {
 setDeliveryAddress((previous) => ({ ...previous, addressLine: event.target.value }));
 clearFieldError("addressLine");
 }
 }
 placeholder="Street address / House number"
 className="rounded-xl border-black/15 "
 />
 {fieldErrors.addressLine ? (
 <p id="custom-order-addressLine-error" className="text-sm text-destructive">
 {fieldErrors.addressLine}
 </p>
 ) : null}
 <div className="grid gap-3 sm:grid-cols-2">
 <div className="space-y-2">
 <label htmlFor="custom-order-city" className="sr-only">
 City
 </label>
 <Input
 id="custom-order-city"
 value={deliveryAddress.city}
 {...getFieldErrorProps("city")}
 onChange={(event) => {
 setDeliveryAddress((previous) => ({ ...previous, city: event.target.value }));
 clearFieldError("city");
 }}
 placeholder="City"
 className="rounded-xl border-black/15 "
 />
 {fieldErrors.city ? (
 <p id="custom-order-city-error" className="text-sm text-destructive">
 {fieldErrors.city}
 </p>
 ) : null}
 </div>
 <div className="space-y-2">
 <label htmlFor="custom-order-region" className="sr-only">
 State or region
 </label>
 <Input
 id="custom-order-region"
 value={deliveryAddress.stateRegion}
 {...getFieldErrorProps("stateRegion")}
 onChange={(event) => {
 setDeliveryAddress((previous) => ({ ...previous, stateRegion: event.target.value }));
 clearFieldError("stateRegion");
 }}
 placeholder="State / Region"
 className="rounded-xl border-black/15 "
 />
 {fieldErrors.stateRegion ? (
 <p id="custom-order-stateRegion-error" className="text-sm text-destructive">
 {fieldErrors.stateRegion}
 </p>
 ) : null}
 </div>
 </div>
 <label htmlFor="custom-order-country" className="sr-only">
 Country
 </label>
 <Input
 id="custom-order-country"
 value={deliveryAddress.country}
 {...getFieldErrorProps("country")}
 onChange={(event) => {
 setDeliveryAddress((previous) => ({ ...previous, country: event.target.value }));
 clearFieldError("country");
 }}
 placeholder="Country"
 className="rounded-xl border-black/15 "
 />
 {fieldErrors.country ? (
 <p id="custom-order-country-error" className="text-sm text-destructive">
 {fieldErrors.country}
 </p>
 ) : null}
 </div>

 <div className="space-y-2">
 <label htmlFor="custom-order-notes" className="inline-flex items-center gap-2 text-sm font-medium text-[#1f1b18] ">
 <Shirt className="size-4" />
 Extra Notes
 </label>
 <Textarea
 id="custom-order-notes"
 rows={4}
 value={notes}
 onChange={(event) => setNotes(event.target.value)}
 placeholder="Any extra request? Sleeve style, neckline, lining, delivery timeline, etc."
 className="rounded-xl border-black/15 "
 />
 </div>

 <div className="space-y-3 rounded-2xl border border-black/10 bg-[#faf9f7] p-4 sm:p-5">
 <p className="form-section-title">Payment Method</p>
 <div className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#1f1b18] ">
 <p className="flex items-center justify-between">
 <span>Product price</span>
 <span>{formatPriceNgn(selectedProductUnitPrice)}</span>
 </p>
 <p className="mt-1 flex items-center justify-between text-[#6b655f] ">
 <span>Customization fee</span>
 <span>{formatPriceNgn(customizationFee)}</span>
 </p>
 <p className="mt-1 flex items-center justify-between text-[#6b655f] ">
 <span>Transaction fee</span>
 <span>{formatPriceNgn(transactionFee)}</span>
 </p>
 <p className="mt-2 flex items-center justify-between font-semibold">
 <span>Total payable</span>
 <span>{formatPriceNgn(selectedCustomOrderTotal)}</span>
 </p>
 </div>
 <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
 <button
 type="button"
 role="radio"
 aria-checked={paymentMethod === "card"}
 onClick={() => setPaymentMethod("card")}
 className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition ${
 paymentMethod === "card"
 ? "border-black bg-black text-white shadow-sm "
 : "border-black/20 bg-white text-[#1f1b18] hover:border-black/50 "
 }`}
 >
 <CreditCard className="size-4" />
 Visa Card
 </button>
 <button
 type="button"
 role="radio"
 aria-checked={paymentMethod === "mobile_money"}
 onClick={() => setPaymentMethod("mobile_money")}
 className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition ${
 paymentMethod === "mobile_money"
 ? "border-black bg-black text-white shadow-sm "
 : "border-black/20 bg-white text-[#1f1b18] hover:border-black/50 "
 }`}
 >
 <Smartphone className="size-4" />
 Mobile Money
 </button>
 </div>
 </div>

 <div className="flex flex-col items-center gap-3 text-center">
 <p className="text-xs text-muted-foreground">
 Secure checkout via Paystack ({paymentMethod === "card" ? "Visa Card" : "Mobile Money"}).
 </p>
 <Button type="submit" className="rounded-full px-7" disabled={isSubmitting || !selectedProduct}>
 {isSubmitting
 ? "Preparing Payment..."
 : paymentMethod === "card"
 ? `Pay ${formatPriceNgn(selectedCustomOrderTotal)} with Visa Card`
 : `Pay ${formatPriceNgn(selectedCustomOrderTotal)} with Mobile Money`}
 </Button>
 </div>
 </form>
 </CardContent>
 </Card>
 </div>
 );
}
