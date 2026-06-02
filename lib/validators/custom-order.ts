import { z } from "zod";

export const customOrderInitSchema = z.object({
  productSlug: z.string().min(2),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  paymentMethod: z.enum(["card", "mobile_money"]).default("card"),
  type: z.string().trim().optional(),
  preferredSize: z.string().min(1),
  preferredColor: z.string().min(1),
  bustSize: z.string().min(1),
  waistSize: z.string().min(1),
  hipSize: z.string().min(1),
  additionalMeasurements: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  referenceImage: z.string().trim().optional(),
  referenceImages: z.array(z.string().trim()).max(6).optional(),
  deliveryAddress: z.object({
    addressLine: z.string().min(5),
    city: z.string().min(2),
    stateRegion: z.string().min(2),
    country: z.string().min(2),
  }),
});

export type CustomOrderInitPayload = z.infer<typeof customOrderInitSchema>;
