import { z } from "zod";

export const cartItemSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  image: z.string().min(1),
  size: z.string().min(1),
  color: z.string().min(1),
  sku: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
});

export const cartPayloadSchema = z.object({
  items: z.array(cartItemSchema),
});

export type CartPayload = z.infer<typeof cartPayloadSchema>;
