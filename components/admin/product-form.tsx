"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

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

const variantSchema = z.object({
  size: z.string().min(1, "Size is required"),
  colorName: z.string().min(1, "Color name is required"),
  colorCode: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use hex code like #111827"),
  image: z
    .string()
    .refine((value) => value === "" || value.startsWith("/") || /^https?:\/\//.test(value), "Image path is invalid")
    .optional(),
  sku: z.string().min(2, "SKU is required"),
  stock: z.number().int().nonnegative("Stock cannot be negative"),
  priceOverride: z
    .union([z.number().int().nonnegative("Price must be positive"), z.literal("")])
    .optional(),
});

const productEditorSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(2, "Category is required"),
  tags: z.string().optional(),
  basePrice: z.number().int().nonnegative("Base price must be positive"),
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

type ProductEditorValues = z.infer<typeof productEditorSchema>;

type ProductFormProps = {
  mode: "create" | "edit";
  productId?: string;
  initialValues?: ProductEditorValues;
};

const productCategories = ["TOPS", "MAXI", "MIDI", "MINI"] as const;
const sizeOptions = ["XS", "S", "M", "L", "XL"] as const;
type ColorOption = { name: string; code: string };
const presetColorOptions: ColorOption[] = [
  { name: "Black", code: "#111827" },
  { name: "White", code: "#F9FAFB" },
  { name: "Brown", code: "#7C2D12" },
  { name: "Wine", code: "#7F1D1D" },
  { name: "Navy", code: "#1E3A8A" },
  { name: "Olive", code: "#4D7C0F" },
];

const defaultValues: ProductEditorValues = {
  name: "",
  slug: "",
  description: "",
  category: "",
  tags: "",
  basePrice: 0,
  images: [],
  status: "active",
  variants: [
    {
      size: "M",
      colorName: "Black",
      colorCode: "#111827",
      image: "",
      sku: "",
      stock: 0,
      priceOverride: "",
    },
  ],
};

export function ProductForm({ mode, productId, initialValues }: ProductFormProps) {
  const router = useRouter();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [bulkSelectedSizes, setBulkSelectedSizes] = useState<string[]>([]);
  const [bulkSelectedColorCodes, setBulkSelectedColorCodes] = useState<string[]>([]);
  const [customColorName, setCustomColorName] = useState("");
  const [customColorCode, setCustomColorCode] = useState("");
  const [customColorOptions, setCustomColorOptions] = useState<ColorOption[]>([]);

  const form = useForm<ProductEditorValues>({
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
  const uploadedImages = form.watch("images") ?? [];
  const selectedCategory = form.watch("category");
  const categoryOptions = productCategories.includes(selectedCategory as (typeof productCategories)[number])
    ? productCategories
    : selectedCategory
      ? [selectedCategory, ...productCategories]
      : productCategories;
  const colorOptions = [...presetColorOptions, ...customColorOptions];

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

  const addCustomColor = () => {
    const trimmedName = customColorName.trim();
    const normalizedCode = customColorCode.trim().toUpperCase();

    if (!trimmedName) {
      toast.error("Enter a color name.");
      return;
    }

    if (!/^#([0-9A-F]{3}|[0-9A-F]{6})$/.test(normalizedCode)) {
      toast.error("Use a valid hex code like #8B5CF6.");
      return;
    }

    const exists = colorOptions.some(
      (colorOption) =>
        colorOption.code.toUpperCase() === normalizedCode || colorOption.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (exists) {
      toast.error("This color already exists.");
      return;
    }

    setCustomColorOptions((previous) => [...previous, { name: trimmedName, code: normalizedCode }]);
    setBulkSelectedColorCodes((previous) => [...previous, normalizedCode]);
    setCustomColorName("");
    setCustomColorCode("");
    toast.success("Color added.");
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

    const variants = form.getValues("variants") ?? [];
    const existingVariants = new Set(
      variants.map((variant) => `${variant.size.toUpperCase()}__${variant.colorCode.toUpperCase()}`),
    );
    const existingSkus = new Set(variants.map((variant) => variant.sku.toUpperCase()));
    const slugBase = form
      .getValues("slug")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let createdCount = 0;
    let skippedCount = 0;

    bulkSelectedSizes.forEach((size) => {
      bulkSelectedColorCodes.forEach((colorCode) => {
        const color = colorOptions.find((colorOption) => colorOption.code === colorCode);

        if (!color) {
          skippedCount += 1;
          return;
        }

        const variantKey = `${size.toUpperCase()}__${color.code.toUpperCase()}`;
        if (existingVariants.has(variantKey)) {
          skippedCount += 1;
          return;
        }

        const colorSkuPart = color.name
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 12);

        let nextSku = `${slugBase || "PRODUCT"}-${size}-${colorSkuPart || "CLR"}`;
        let counter = 2;

        while (existingSkus.has(nextSku)) {
          nextSku = `${slugBase || "PRODUCT"}-${size}-${colorSkuPart || "CLR"}-${counter}`;
          counter += 1;
        }

        existingSkus.add(nextSku);
        existingVariants.add(variantKey);

        append({
          size,
          colorName: color.name,
          colorCode: color.code,
          image: "",
          sku: nextSku,
          stock: 0,
          priceOverride: "",
        });

        createdCount += 1;
      });
    });

    if (createdCount === 0) {
      toast.error("Selected size/color combinations already exist.");
      return;
    }

    toast.success(
      `Added ${createdCount} variant${createdCount > 1 ? "s" : ""}${skippedCount ? ` • skipped ${skippedCount}` : ""}.`,
    );
  };

  const removeCustomColor = (colorCode: string) => {
    setCustomColorOptions((previous) => previous.filter((entry) => entry.code !== colorCode));
    setBulkSelectedColorCodes((previous) => previous.filter((entry) => entry !== colorCode));
  };

  const handleImageUpload = async (files: FileList | File[]) => {
    const existingImages = form.getValues("images") ?? [];
    const selectedFiles = Array.from(files);

    if (existingImages.length + selectedFiles.length > 10) {
      toast.error("You can upload a maximum of 10 images.");
      return;
    }

    setIsUploadingImage(true);

    try {
      const nextImages = [...existingImages];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/admin/uploads/product-image", {
          method: "POST",
          body: formData,
        });

        const json = (await response.json()) as {
          ok: boolean;
          message: string;
          data?: { imagePath?: string };
        };

        if (!response.ok || !json.ok || !json.data?.imagePath) {
          toast.error(json.message || "Image upload failed");
          return;
        }

        nextImages.push(json.data.imagePath);
      }

      form.setValue("images", nextImages, { shouldValidate: true });
      toast.success(selectedFiles.length > 1 ? "Images uploaded" : "Image uploaded");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onSubmit = async (values: ProductEditorValues) => {
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
      variants: values.variants.map((variant) => ({
        size: variant.size,
        color: {
          name: variant.colorName,
          code: variant.colorCode,
        },
        image: variant.image && variant.image.length > 0 ? variant.image : undefined,
        sku: variant.sku,
        stock: variant.stock,
        priceOverride:
          variant.priceOverride === "" || typeof variant.priceOverride === "undefined"
            ? undefined
            : Number(variant.priceOverride),
      })),
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

  const handleVariantStockInput = (value: string, onChange: (value: number) => void) => {
    if (value === "") {
      onChange(0);
      return;
    }

    onChange(Number(value));
  };

  return (
    <Card className="border-black/10 bg-white/90 shadow-sm">
      <CardHeader className="border-b border-black/10">
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
                    <Input placeholder="Cloud Tee" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="cloud-tee" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Base price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="42000"
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
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
                    <Textarea placeholder="Premium cotton blend..." rows={4} {...field} />
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
                      <div className="space-y-2">
                        <select
                          className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
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
                        <div className="flex flex-wrap gap-2">
                          {productCategories.map((categoryOption) => (
                            <Button
                              key={`quick-category-${categoryOption}`}
                              type="button"
                              size="sm"
                              variant={field.value === categoryOption ? "default" : "outline"}
                              className="h-8"
                              onClick={() => field.onChange(categoryOption)}
                            >
                              {categoryOption}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </FormControl>
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
                        className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                            <img
                              src={imagePath}
                              alt={`Uploaded preview ${index + 1}`}
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
                    <Input placeholder="new, summer, limited" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 rounded-xl border border-black/10 bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium">Variant Builder (Size + Color)</p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        size: "",
                        colorName: "",
                        colorCode: "#111827",
                        image: "",
                        sku: "",
                        stock: 0,
                        priceOverride: "",
                      })
                    }
                  >
                    Add variant
                  </Button>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-black/10 bg-white p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Quick generate variants
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
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Select colors</p>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((colorOption) => (
                      <Button
                        key={colorOption.code}
                        type="button"
                        size="sm"
                        variant={bulkSelectedColorCodes.includes(colorOption.code) ? "default" : "outline"}
                        className="h-8"
                        onClick={() => toggleBulkColor(colorOption.code)}
                      >
                        <span
                          className="mr-2 inline-block h-3 w-3 rounded-full border border-black/20"
                          style={{ backgroundColor: colorOption.code }}
                        />
                        {colorOption.name}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Input
                    placeholder="Custom color name"
                    value={customColorName}
                    onChange={(event) => setCustomColorName(event.target.value)}
                  />
                  <Input
                    placeholder="#9F1239"
                    value={customColorCode}
                    onChange={(event) => setCustomColorCode(event.target.value)}
                  />
                  <Button type="button" variant="outline" onClick={addCustomColor}>
                    Add color
                  </Button>
                </div>
                {customColorOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {customColorOptions.map((colorOption) => (
                      <Button
                        key={`remove-${colorOption.code}`}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => removeCustomColor(colorOption.code)}
                      >
                        Remove {colorOption.name}
                      </Button>
                    ))}
                  </div>
                ) : null}
                <div>
                  <Button type="button" size="sm" onClick={addSizeColorVariants}>
                    Generate size + color variants
                  </Button>
                </div>
              </div>

              {variantFields.map((field, index) => (
                <div key={field.id} className="grid gap-2 rounded-xl border border-black/10 bg-white p-3 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name={`variants.${index}.size`}
                    render={({ field: variantField }) => (
                      <FormItem>
                        <FormLabel>Size</FormLabel>
                        <FormControl>
                          <select
                            className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                            value={variantField.value}
                            onChange={(event) => variantField.onChange(event.target.value)}
                          >
                            <option value="" disabled>
                              Select size
                            </option>
                            {sizeOptions.map((sizeOption) => (
                              <option key={sizeOption} value={sizeOption}>
                                {sizeOption}
                              </option>
                            ))}
                            {variantField.value && !sizeOptions.includes(variantField.value as (typeof sizeOptions)[number]) ? (
                              <option value={variantField.value}>{variantField.value}</option>
                            ) : null}
                          </select>
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
                          <Input placeholder="Black" {...variantField} />
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
                          <Input placeholder="#111827" {...variantField} />
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
                            className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
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
                          <Input placeholder="CT-BLK-M" {...variantField} />
                        </FormControl>
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
                          <Input
                            type="number"
                            placeholder="10"
                            value={variantField.value}
                            onChange={(event) => handleVariantStockInput(event.target.value, variantField.onChange)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`variants.${index}.priceOverride`}
                    render={({ field: variantField }) => (
                      <FormItem>
                        <FormLabel>Price Override (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="45000"
                            value={variantField.value === "" ? "" : String(variantField.value ?? "")}
                            onChange={(event) => {
                              const value = event.target.value;
                              variantField.onChange(value === "" ? "" : Number(value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {variantFields.length > 1 ? (
                    <div className="sm:col-span-3">
                      <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                        Remove variant
                      </Button>
                    </div>
                  ) : null}
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
