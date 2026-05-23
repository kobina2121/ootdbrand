import { z } from "zod";

import { cartItemSchema } from "@/lib/validators/cart";

export const checkoutInitSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  phone: z.string().min(7),
  address: z.string().min(10),
  paymentMethod: z.enum(["card", "mobile_money"]).default("card"),
  items: z.array(cartItemSchema).min(1),
});

export type CheckoutInitPayload = z.infer<typeof checkoutInitSchema>;
