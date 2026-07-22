"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { uploadPresigned } from "@vercel/blob/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { DefaultValues } from "react-hook-form";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { buildImageBlobPath } from "@/lib/blob-upload";
import { catalogColorOptions, type ColorOption } from "@/lib/color-options";
import { normalizeProductSlug } from "@/lib/product-slug";
import { buildVariantRows, type ProductVariantDraft } from "@/lib/product-variant-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
 Form,
 FormControl,
 FormField,
 FormItem,
 FormLabel,
 FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const nonnegativeIntegerField = (message: string) =>
 z.preprocess(
 (value) => {
 if (value === "") {
 return undefined;
 }

 if (typeof value === "string") {
 return Number(value);
 }

 return value;
 },
 z.number().int().nonnegative(message),
 );

const variantSchema = z.object({
 size: z.string().min(1, "Select a size"),
 colorName: z.string().min(1, "Color name is required"),
 colorCode: z
 .string()
 .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use hex code like #111827"),
 image: z
 .string()
 .refine((value) => value === "" || value.startsWith("/") || /^https?:\/\//.test(value), "Image path is invalid")
 .optional(),
 sku: z.string().min(2, "SKU is required"),
 stock: nonnegativeIntegerField("Stock cannot be negative"),
});

const productEditorSchema = z.object({
 name: z.string().min(2, "Product name is required"),
 slug: z.string().min(2, "Slug is required"),
 description: z.string().min(10, "Description must be at least 10 characters"),
 category: z.string().min(2, "Category is required"),
 tags: z.string().optional(),
 basePrice: nonnegativeIntegerField("Fixed price must be positive"),
 images: z
 .array(
 z
 .string()
 .min(1, "Please upload an image")
 .refine((value) => value.startsWith("/") || /^https?:\/\//.test(value), "Image path is invalid"),
 )
 .min(1, "Please upload at least one image")
 .max(10, "Maximum of 10 images"),
 status: z.enum(["active", "draft"]),
 variants: z.array(variantSchema).min(1, "Add at least one variant"),
});

type ProductEditorInputValues = z.input<typeof productEditorSchema>;
type ProductEditorValues = z.output<typeof productEditorSchema>;

type ProductFormProps = {
 mode: "create" | "edit";
 productId?: string;
 initialValues?: ProductEditorInputValues;
};

const productCategories = ["TOPS", "MAXI", "MIDI", "MINI"] as const;
const sizeOptions = ["XS", "S", "M", "L", "XL"] as const;

const fieldClassName =
 "h-11 rounded-xl border-black/15 bg-white text-[15px] shadow-none focus-visible:ring-1 focus-visible:ring-black/25 ";
const numericFieldClassName =
 `${fieldClassName} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;
const selectClassName =
 "h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-[15px] shadow-none outline-none transition focus:border-black/30 focus:ring-1 focus:ring-black/25 ";
const textAreaClassName =
 "min-h-28 rounded-xl border-black/15 bg-white text-[15px] shadow-none focus-visible:ring-1 focus-visible:ring-black/25 ";
const fieldHelperClassName = "min-h-5 text-xs text-muted-foreground";
const maxProductImageSizeBytes = 10 * 1024 * 1024;
const productImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const productImageTypeMessage = "Use a JPEG, PNG, WebP, or AVIF image for product photos.";
const productImageSizeMessage = "Product images must be 10MB or smaller.";

function AdminNumericInput({
 value,
 onChange,
 onBlur,
 placeholder,
}: {
 value: unknown;
 onChange: (value: number | "") => void;
 onBlur: () => void;
 placeholder: string;
}) {
 const [draftValue, setDraftValue] = useState(value === undefined ? "" : String(value));

 return (
 <Input
 type="text"
 inputMode="numeric"
 pattern="[0-9]*"
 placeholder={placeholder}
 className={numericFieldClassName}
 value={draftValue}
 onChange={(event) => {
 const nextValue = event.target.value;

 if (!/^\d*$/.test(nextValue)) {
 return;
 }

 setDraftValue(nextValue);
 onChange(nextValue === "" ? "" : Number(nextValue));
 }}
 onFocus={(event) => event.currentTarget.select()}
 onBlur={onBlur}
 />
 );
}

function getInitialProductColorOptions(initialValues?: ProductEditorInputValues) {
 const seededVariants = initialValues?.variants ?? [];

 return seededVariants
 .map((variant) => ({
 name: variant.colorName.trim(),
 code: variant.colorCode.trim().toUpperCase(),
 }))
 .filter(
 (colorOption, index, allColors) =>
 colorOption.name &&
 colorOption.code &&
 !catalogColorOptions.some((catalogColor) => catalogColor.code.toUpperCase() === colorOption.code) &&
 allColors.findIndex((entry) => entry.code === colorOption.code) === index,
 );
}

const defaultValues: DefaultValues<ProductEditorInputValues> = {
 name: "",
 slug: "",
 description: "",
 category: "",
 tags: "",
 basePrice: undefined,
 images: [],
 status: "active",
 variants: [
 {
 size: "M",
 colorName: "Black",
 colorCode: "#111827",
 image: "",
 sku: "",
 stock: undefined,
 },
 ],
};

export function ProductForm({ mode, productId, initialValues }: ProductFormProps) {
 const router = useRouter();
 const [isUploadingImage, setIsUploadingImage] = useState(false);
 const [bulkSelectedSizes, setBulkSelectedSizes] = useState<string[]>([]);
 const [bulkSelectedColorCodes, setBulkSelectedColorCodes] = useState<string[]>([]);
 const [colorSearch, setColorSearch] = useState("");
 const [initialProductColorOptions] = useState<ColorOption[]>(() => getInitialProductColorOptions(initialValues));

 const form = useForm<ProductEditorInputValues, unknown, ProductEditorValues>({
 resolver: zodResolver(productEditorSchema),
 defaultValues: initialValues ?? defaultValues,
 });

 const {
 fields: variantFields,
 append,
 remove,
 } = useFieldArray({
 control: form.control,
 name: "variants",
 });

 const isSubmitting = form.formState.isSubmitting;
 const uploadedImages = useWatch({ control: form.control, name: "images" }) ?? [];
 const selectedCategory = useWatch({ control: form.control, name: "category" });
 const watchedVariants = useWatch({ control: form.control, name: "variants" }) ?? [];
 const categoryOptions = productCategories.includes(selectedCategory as (typeof productCategories)[number])
 ? productCategories
 : selectedCategory
 ? [selectedCategory, ...productCategories]
 : productCategories;
 const colorOptions = useMemo(() => {
 const colorsByCode = new Map<string, ColorOption>();

 [...catalogColorOptions, ...initialProductColorOptions].forEach((colorOption) => {
 colorsByCode.set(colorOption.code.toUpperCase(), colorOption);
 });

 return Array.from(colorsByCode.values()).sort((a, b) => a.name.localeCompare(b.name));
 }, [initialProductColorOptions]);
 const filteredColorOptions = useMemo(() => {
 const query = colorSearch.trim().toLowerCase();
 const matches = query
 ? colorOptions.filter(
 (colorOption) =>
 colorOption.name.toLowerCase().includes(query) || colorOption.code.toLowerCase().includes(query),
 )
 : colorOptions;

 return matches.slice(0, 80);
 }, [colorOptions, colorSearch]);
 const selectedBulkColors = bulkSelectedColorCodes
 .map((colorCode) => colorOptions.find((colorOption) => colorOption.code.toUpperCase() === colorCode.toUpperCase()))
 .filter((colorOption): colorOption is ColorOption => Boolean(colorOption));

 const toggleBulkSize = (size: string) => {
 setBulkSelectedSizes((previous) =>
 previous.includes(size) ? previous.filter((entry) => entry !== size) : [...previous, size],
 );
 };

 const toggleBulkColor = (colorCode: string) => {
 setBulkSelectedColorCodes((previous) =>
 previous.includes(colorCode) ? previous.filter((entry) => entry !== colorCode) : [...previous, colorCode],
 );
 };

 const addSizeColorVariants = () => {
 if (bulkSelectedSizes.length === 0) {
 toast.error("Select at least one size.");
 return;
 }

 if (bulkSelectedColorCodes.length === 0) {
 toast.error("Select at least one color.");
 return;
 }

 const existingVariants = (form.getValues("variants") ?? []) as ProductVariantDraft[];
 const { variants, skippedCount } = buildVariantRows({
 selectedSizes: bulkSelectedSizes,
 selectedColorCodes: bulkSelectedColorCodes,
 colorOptions,
 existingVariants,
 slug: form.getValues("slug"),
 });
 const createdCount = variants.length;

 if (createdCount === 0) {
 toast.error("Selected size/color combinations already exist.");
 return;
 }

 append(variants);
 toast.success(
 `Added ${createdCount} variant${createdCount > 1 ? "s" : ""}${skippedCount ? ` • skipped ${skippedCount}` : ""}.`,
 );
 };

 const handleImageUpload = async (files: FileList | File[]) => {
 const existingImages = form.getValues("images") ?? [];
 const selectedFiles = Array.from(files);

 if (existingImages.length + selectedFiles.length > 10) {
 toast.error("You can upload a maximum of 10 images.");
 return;
 }

 const invalidTypeFile = selectedFiles.find((file) => !productImageMimeTypes.has(file.type));
 if (invalidTypeFile) {
 toast.error(
 invalidTypeFile.type === "image/heic" || invalidTypeFile.type === "image/heif"
 ? "iPhone HEIC photos need to be changed to JPEG before uploading as product photos."
 : productImageTypeMessage,
 );
 return;
 }

 const oversizedFile = selectedFiles.find((file) => file.size > maxProductImageSizeBytes);
 if (oversizedFile) {
 toast.error(productImageSizeMessage);
 return;
 }

 setIsUploadingImage(true);

 try {
 const nextImages = [...existingImages];
 const failedUploads: string[] = [];

 for (const file of selectedFiles) {
 try {
 const blob = await uploadPresigned(buildImageBlobPath("products", file.name), file, {
 access: "public",
 handleUploadUrl: "/api/admin/uploads/product-image",
 });

 nextImages.push(blob.url);
 } catch (error) {
 const message = error instanceof Error ? error.message : "Upload failed";
 failedUploads.push(`${file.name}: ${message}`);
 }
 }

 form.setValue("images", nextImages, { shouldValidate: true });
 if (failedUploads.length === selectedFiles.length) {
 toast.error(failedUploads[0] || "Image upload failed");
 return;
 }

 toast.success(
 failedUploads.length > 0
 ? `Uploaded ${selectedFiles.length - failedUploads.length} image(s). ${failedUploads.length} failed.`
 : selectedFiles.length > 1
 ? "Images uploaded"
 : "Image uploaded",
 );
 } catch (error) {
 toast.error(error instanceof Error ? error.message : "Image upload failed");
 } finally {
 setIsUploadingImage(false);
 }
 };

 const onSubmit = async (values: ProductEditorValues) => {
 const flattenedVariants = values.variants.map((variant) => ({
 size: variant.size.trim().toUpperCase(),
 color: {
 name: variant.colorName.trim(),
 code: variant.colorCode.trim().toUpperCase(),
 },
 image: variant.image && variant.image.length > 0 ? variant.image : undefined,
 sku: variant.sku.trim().toUpperCase(),
 stock: variant.stock,
 }));

 const skuSet = new Set<string>();
 const hasDuplicateSku = flattenedVariants.some((variant) => {
 if (skuSet.has(variant.sku)) {
 return true;
 }

 skuSet.add(variant.sku);
 return false;
 });

 if (hasDuplicateSku) {
 toast.error("Duplicate SKU detected after size expansion. Update SKU values and try again.");
 return;
 }

 const payload = {
 name: values.name,
 slug: values.slug,
 description: values.description,
 category: values.category,
 tags: values.tags
 ? values.tags
 .split(",")
 .map((tag) => tag.trim())
 .filter(Boolean)
 : [],
 basePrice: values.basePrice,
 images: values.images,
 isActive: values.status === "active",
 variants: flattenedVariants,
 };

 const endpoint = mode === "create" ? "/api/admin/products" : `/api/admin/products/${productId}`;
 const method = mode === "create" ? "POST" : "PATCH";

 try {
 const response = await fetch(endpoint, {
 method,
 headers: {
 "Content-Type": "application/json",
 },
 body: JSON.stringify(payload),
 });

 const json = (await response.json()) as { ok: boolean; message: string };

 if (!response.ok || !json.ok) {
 toast.error(json.message || "Could not save product");
 return;
 }

 toast.success(mode === "create" ? "Product created successfully" : "Product updated successfully");
 router.push("/admin/products");
 router.refresh();
 } catch {
 toast.error("Could not save product");
 }
 };

 return (
 <Card className="border-black/10 bg-white/90 shadow-sm ">
 <CardHeader className="border-b border-black/10 ">
 <p className="text-[0.72rem] uppercase tracking-[0.16em] text-muted-foreground">Catalog editor</p>
 <CardTitle className="font-sans text-2xl font-semibold">
 {mode === "create" ? "Create Product" : "Edit Product"}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <Form {...form}>
 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
 <FormField
 control={form.control}
 name="name"
 render={({ field }) => (
 <FormItem className="space-y-2">
 <FormLabel>Product name</FormLabel>
 <FormControl>
 <Input placeholder="Cloud Tee" className={fieldClassName} {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <div className="grid items-start gap-4 sm:grid-cols-2">
 <FormField
 control={form.control}
 name="slug"
 render={({ field }) => (
 <FormItem className="space-y-2 sm:min-h-[118px]">
 <FormLabel>Slug</FormLabel>
 <FormControl>
 <Input
 placeholder="cloud-tee"
 className={fieldClassName}
 {...field}
 onChange={(event) => {
 const nextValue = event.target.value;
 field.onChange(nextValue ? normalizeProductSlug(nextValue) : "");
 }}
 />
 </FormControl>
 <p className={fieldHelperClassName}>Use lowercase and hyphens only (example: cloud-tee).</p>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="basePrice"
 render={({ field }) => (
 <FormItem className="space-y-2 sm:min-h-[118px]">
 <FormLabel>Fixed price</FormLabel>
 <FormControl>
 <AdminNumericInput
 value={field.value}
 onChange={field.onChange}
 onBlur={field.onBlur}
 placeholder="42000"
 />
 </FormControl>
 <p className={fieldHelperClassName}>One price applies to every size and color variant.</p>
 <FormMessage />
 </FormItem>
 )}
 />
 </div>

 <FormField
 control={form.control}
 name="description"
 render={({ field }) => (
 <FormItem className="space-y-2">
 <FormLabel>Description</FormLabel>
 <FormControl>
 <Textarea placeholder="Premium cotton blend..." rows={4} className={textAreaClassName} {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <div className="grid gap-4 sm:grid-cols-2">
 <FormField
 control={form.control}
 name="category"
 render={({ field }) => (
 <FormItem className="space-y-2">
 <FormLabel>Category</FormLabel>
 <FormControl>
 <select
 className={selectClassName}
 value={field.value}
 onChange={(event) => field.onChange(event.target.value)}
 >
 <option value="" disabled>
 Select category
 </option>
 {categoryOptions.map((categoryOption) => (
 <option key={categoryOption} value={categoryOption}>
 {categoryOption}
 </option>
 ))}
 </select>
 </FormControl>
 <p className={fieldHelperClassName}>Pick where this product appears in shop sections.</p>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="status"
 render={({ field }) => (
 <FormItem className="space-y-2">
 <FormLabel>Status</FormLabel>
 <FormControl>
 <select
 className={selectClassName}
 value={field.value}
 onChange={(event) => field.onChange(event.target.value)}
 >
 <option value="active">Active</option>
 <option value="draft">Draft</option>
 </select>
 </FormControl>
 <p className={fieldHelperClassName}>Active products are visible in the storefront.</p>
 <FormMessage />
 </FormItem>
 )}
 />
 </div>

 <div className="space-y-2">
 <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Quick category picks</p>
 <div className="flex flex-wrap gap-2">
 {productCategories.map((categoryOption) => (
 <Button
 key={`quick-category-${categoryOption}`}
 type="button"
 size="sm"
 variant={selectedCategory === categoryOption ? "default" : "outline"}
 className="h-8 rounded-lg"
 onClick={() => form.setValue("category", categoryOption, { shouldValidate: true, shouldDirty: true })}
 >
 {categoryOption}
 </Button>
 ))}
 </div>
 </div>

 <FormField
 control={form.control}
 name="images"
 render={() => (
 <FormItem className="space-y-2">
 <FormLabel>Product images (max 10)</FormLabel>
 <FormControl>
 <Input
 type="file"
 accept="image/jpeg,image/png,image/webp,image/avif"
 multiple
 className={fieldClassName}
 disabled={isUploadingImage || uploadedImages.length >= 10}
 onChange={async (event) => {
 const inputElement = event.currentTarget;
 const files = inputElement.files;

 if (!files || files.length === 0) {
 return;
 }

 await handleImageUpload(files);
 inputElement.value = "";
 }}
 />
 </FormControl>

 {uploadedImages.length > 0 ? (
 <div className="space-y-2">
 <p className="text-xs text-muted-foreground">
 {uploadedImages.length} image(s) uploaded
 </p>
 <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
 {uploadedImages.map((imagePath, index) => (
 <div key={`${imagePath}-${index}`} className="space-y-1">
 <Image
 src={imagePath}
 alt={`Uploaded preview ${index + 1}`}
 width={240}
 height={112}
 unoptimized
 className="h-28 w-full rounded-md border object-cover"
 />
 <Button
 type="button"
 size="sm"
 variant="outline"
 className="w-full"
 onClick={() =>
 form.setValue(
 "images",
 uploadedImages.filter((_, imageIndex) => imageIndex !== index),
 { shouldValidate: true },
 )
 }
 >
 Remove
 </Button>
 </div>
 ))}
 </div>
 </div>
 ) : null}

 {isUploadingImage ? (
 <p className="text-xs text-muted-foreground">Uploading image(s)...</p>
 ) : null}
 <FormMessage />
 </FormItem>
 )}
 />

 <FormField
 control={form.control}
 name="tags"
 render={({ field }) => (
 <FormItem className="space-y-2">
 <FormLabel>Tags (comma separated)</FormLabel>
 <FormControl>
 <Input placeholder="new, summer, limited" className={fieldClassName} {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <div className="space-y-3 rounded-xl border border-black/10 bg-muted/20 p-4 ">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="space-y-1">
 <p className="text-sm font-medium">Variant Builder (Size + Color)</p>
 <p className="text-xs text-muted-foreground">
 Each row below saves one exact size/color combination. Use quick generate to create all combinations at once.
 </p>
 </div>
 <div className="flex items-center gap-2">
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={() =>
 append({
 size: "M",
 colorName: "",
 colorCode: "#111827",
 image: "",
 sku: "",
 stock: 0,
 })
 }
 >
 Add variant
 </Button>
 </div>
 </div>

 <div className="space-y-3 rounded-lg border border-black/10 bg-white p-3 ">
 <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
 Quick generate variants
 </p>
 <p className="text-xs text-muted-foreground">
 Selected {bulkSelectedSizes.length} size(s) x {bulkSelectedColorCodes.length} color(s) ={" "}
 {bulkSelectedSizes.length * bulkSelectedColorCodes.length} combination(s)
 </p>
 <div className="flex flex-wrap gap-2">
 {sizeOptions.map((sizeOption) => (
 <Button
 key={sizeOption}
 type="button"
 size="sm"
 variant={bulkSelectedSizes.includes(sizeOption) ? "default" : "outline"}
 className="h-8 min-w-11"
 onClick={() => toggleBulkSize(sizeOption)}
 >
 {sizeOption}
 </Button>
 ))}
 </div>
 <div className="space-y-2">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Select colors</p>
 <p className="text-xs text-muted-foreground">{bulkSelectedColorCodes.length} selected</p>
 </div>
 <Input
 placeholder="Search color name or hex code"
 className={fieldClassName}
 value={colorSearch}
 onChange={(event) => setColorSearch(event.target.value)}
 />
 {selectedBulkColors.length > 0 ? (
 <div className="flex flex-wrap gap-2 rounded-xl border border-black/10 bg-muted/20 p-2">
 {selectedBulkColors.map((colorOption) => (
 <Button
 key={`selected-color-${colorOption.code}`}
 type="button"
 variant="default"
 size="sm"
 className="h-8"
 onClick={() => toggleBulkColor(colorOption.code)}
 >
 <span
 className="mr-2 inline-block h-3 w-3 rounded-full border border-black/20"
 style={{ backgroundColor: colorOption.code }}
 />
 {colorOption.name} x
 </Button>
 ))}
 </div>
 ) : null}
 <div className="max-h-64 overflow-y-auto rounded-xl border border-black/10 bg-white p-2">
 {filteredColorOptions.length > 0 ? (
 <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
 {filteredColorOptions.map((colorOption) => {
 const isSelected = bulkSelectedColorCodes.includes(colorOption.code);

 return (
 <Button
 key={colorOption.code}
 type="button"
 variant={isSelected ? "default" : "outline"}
 size="sm"
 className="h-10 justify-start"
 onClick={() => toggleBulkColor(colorOption.code)}
 >
 <span
 className="mr-2 inline-block h-3.5 w-3.5 rounded-full border border-black/20"
 style={{ backgroundColor: colorOption.code }}
 />
 <span className="truncate">{colorOption.name}</span>
 </Button>
 );
 })}
 </div>
 ) : (
 <p className="px-2 py-3 text-sm text-muted-foreground">No colors found. Try another color name.</p>
 )}
 </div>
 <p className="text-xs text-muted-foreground">
 Search and select multiple colors, then generate all selected size/color combinations.
 </p>
 </div>
 <div>
 <Button type="button" size="sm" onClick={addSizeColorVariants}>
 Generate size + color variants
 </Button>
 </div>
 </div>

 <div className="rounded-lg border border-dashed border-black/10 bg-white/70 px-3 py-2 text-xs text-muted-foreground">
 {watchedVariants.length} saved combination(s) currently in this product.
 </div>

 {variantFields.map((field, index) => (
 <div key={field.id} className="grid gap-2 rounded-xl border border-black/10 bg-white p-3 sm:grid-cols-3 ">
 <div className="sm:col-span-3 flex items-center justify-between gap-3">
 <div>
 <p className="text-sm font-medium text-foreground">Variant {index + 1}</p>
 <p className="text-xs text-muted-foreground">
 {watchedVariants[index]?.size || "No size"} / {watchedVariants[index]?.colorName || "No color"}
 </p>
 </div>
 {variantFields.length > 1 ? (
 <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
 Remove variant
 </Button>
 ) : null}
 </div>
 <FormField
 control={form.control}
 name={`variants.${index}.size`}
 render={({ field: variantField }) => (
 <FormItem>
 <FormLabel>Size</FormLabel>
 <FormControl>
 <div className="space-y-2 rounded-md border border-black/10 p-2 ">
 <div className="flex flex-wrap gap-2">
 {sizeOptions.map((sizeOption) => (
 <Button
 key={`${field.id}-${sizeOption}`}
 type="button"
 size="sm"
 variant={variantField.value === sizeOption ? "default" : "outline"}
 className="h-8 min-w-11"
 onClick={() => form.setValue(`variants.${index}.size`, sizeOption, { shouldValidate: true, shouldDirty: true })}
 >
 {sizeOption}
 </Button>
 ))}
 </div>
 <p className="text-xs text-muted-foreground">
 Selected: {variantField.value || "None"}
 </p>
 </div>
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name={`variants.${index}.colorName`}
 render={({ field: variantField }) => (
 <FormItem>
 <FormLabel>Color Name</FormLabel>
 <FormControl>
 <Input placeholder="Black" className={fieldClassName} {...variantField} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name={`variants.${index}.colorCode`}
 render={({ field: variantField }) => (
 <FormItem>
 <FormLabel>Color Code</FormLabel>
 <FormControl>
 <Input placeholder="#111827" className={fieldClassName} {...variantField} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name={`variants.${index}.image`}
 render={({ field: variantField }) => (
 <FormItem>
 <FormLabel>Display Image</FormLabel>
 <FormControl>
 <select
 className={selectClassName}
 value={variantField.value ?? ""}
 onChange={(event) => variantField.onChange(event.target.value)}
 >
 <option value="">Use default product image</option>
 {uploadedImages.map((imagePath, imageIndex) => (
 <option key={`variant-${index}-image-${imageIndex}`} value={imagePath}>
 Image {imageIndex + 1}
 </option>
 ))}
 </select>
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name={`variants.${index}.sku`}
 render={({ field: variantField }) => (
 <FormItem>
 <FormLabel>SKU</FormLabel>
 <FormControl>
 <Input placeholder="CT-BLK" className={fieldClassName} {...variantField} />
 </FormControl>
 <p className="text-xs text-muted-foreground">
 One SKU per exact size/color combination.
 </p>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name={`variants.${index}.stock`}
 render={({ field: variantField }) => (
 <FormItem>
 <FormLabel>Stock</FormLabel>
 <FormControl>
 <AdminNumericInput
 value={variantField.value}
 onChange={variantField.onChange}
 onBlur={variantField.onBlur}
 placeholder="10"
 />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 </div>
 ))}
 </div>

 <Button type="submit" disabled={isSubmitting || isUploadingImage}>
 {isSubmitting
 ? mode === "create"
 ? "Creating..."
 : "Saving..."
 : isUploadingImage
 ? "Uploading image..."
 : mode === "create"
 ? "Create product"
 : "Save changes"}
 </Button>
 </form>
 </Form>
 </CardContent>
 </Card>
 );
}
