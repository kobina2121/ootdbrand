import { z } from "zod";

export const customOrderInitSchema = z.object({
  productSlug: z.string().min(2),
  variantSku: z.string().min(2),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  paymentMethod: z.enum(["card", "mobile_money"]).default("card"),
  type: z.string().trim().optional(),
  category: z.string().min(2),
  size: z.string().min(1),
  color: z.string().min(2),
  measurements: z.string().min(5),
  notes: z.string().trim().optional(),
  referenceImage: z.string().trim().optional(),
  deliveryAddress: z.object({
    addressLine: z.string().min(5),
    city: z.string().min(2),
    stateRegion: z.string().min(2),
    country: z.string().min(2),
  }),
});

export type CustomOrderInitPayload = z.infer<typeof customOrderInitSchema>;
