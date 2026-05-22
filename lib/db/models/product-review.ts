import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

const productReviewSchema = new Schema(
  {
    productSlug: { type: String, required: true, trim: true, lowercase: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, minlength: 5, maxlength: 600 },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productReviewSchema.index({ productSlug: 1, createdAt: -1 });
productReviewSchema.index({ userId: 1, productSlug: 1, createdAt: -1 });

export type ProductReviewModelType = InferSchemaType<typeof productReviewSchema>;

export const ProductReviewModel =
  (models.ProductReview as Model<ProductReviewModelType> | undefined) ??
  model<ProductReviewModelType>("ProductReview", productReviewSchema);

