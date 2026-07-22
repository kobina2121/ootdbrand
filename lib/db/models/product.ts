import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

const productVariantSchema = new Schema(
  {
    name: { type: String, trim: true },
    size: { type: String, required: true, trim: true },
    color: {
      name: { type: String, required: true, trim: true },
      code: { type: String, required: true, trim: true },
    },
    image: { type: String, trim: true },
    sku: { type: String, required: true, trim: true },
    priceOverride: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    tags: [{ type: String, trim: true }],
    basePrice: { type: Number, required: true, min: 0 },
    images: [{ type: String, required: true, trim: true }],
    variants: { type: [productVariantSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ "variants.sku": 1 }, { unique: true });

export type ProductModelType = InferSchemaType<typeof productSchema>;

export const ProductModel =
  (models.Product as Model<ProductModelType> | undefined) ??
  model<ProductModelType>("Product", productSchema);
