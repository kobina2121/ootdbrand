import { z } from "zod";
import { productPayloadSchema, productVariantSchema } from "@/lib/validators/product";

export const adminProductVariantSchema = productVariantSchema;
export const adminProductSchema = productPayloadSchema;

export const adminProductUpdateSchema = adminProductSchema.partial();

export const orderStatusSchema = z.enum(["Pending", "Success", "Failed"]);
