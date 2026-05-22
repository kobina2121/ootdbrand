import { z } from "zod";

export const productReviewPayloadSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(600),
});

export type ProductReviewPayload = z.infer<typeof productReviewPayloadSchema>;

