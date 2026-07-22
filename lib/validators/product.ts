import { z } from "zod";

export const imagePathSchema = z
  .string()
  .min(1)
  .refine((value) => {
    if (value.startsWith("/")) {
      return true;
    }

    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }, "Image must be an uploaded path or a valid URL");

export const productVariantSchema = z.object({
  name: z.string().trim().optional(),
  size: z.string().min(1),
  color: z.object({
    name: z.string().min(1),
    code: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Color code must be a valid hex value"),
  }),
  image: imagePathSchema.optional(),
  sku: z.string().min(2),
  priceOverride: z.number().int().nonnegative().optional(),
  stock: z.number().int().nonnegative(),
});

export const productPayloadSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  category: z.string().min(2),
  tags: z.array(z.string().min(1)).default([]),
  basePrice: z.number().int().nonnegative(),
  images: z.array(imagePathSchema).min(1).max(10),
  variants: z.array(productVariantSchema).min(1),
  isActive: z.boolean().default(true),
});

export const productFormSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  basePrice: z.number().positive("Base price must be greater than 0"),
  category: z.string().min(2, "Category is required"),
  status: z.enum(["active", "draft"]),
  featured: z.boolean(),
  sizePreset: z.enum(["core", "inclusive"]),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductPayloadValues = z.infer<typeof productPayloadSchema>;
