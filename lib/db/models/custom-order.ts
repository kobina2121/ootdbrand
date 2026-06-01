import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

const deliveryAddressSchema = new Schema(
  {
    addressLine: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    stateRegion: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const customOrderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productSlug: { type: String, required: true, trim: true },
    productNameSnapshot: { type: String, required: true, trim: true },
    productImageSnapshot: { type: String, required: false, trim: true },
    variantSkuSnapshot: { type: String, required: true, trim: true },
    variantUnitPriceSnapshot: { type: Number, required: true, min: 0 },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    type: { type: String, required: false, trim: true },
    category: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    measurements: { type: String, required: true, trim: true },
    notes: { type: String, required: false, trim: true },
    referenceImage: { type: String, required: false, trim: true },
    deliveryAddress: { type: deliveryAddressSchema, required: true },
    amountTotal: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "GHS", trim: true },
    status: {
      type: String,
      enum: ["Pending", "Success", "Failed"],
      default: "Pending",
      required: true,
    },
    paymentProvider: { type: String, default: "paystack", required: true },
    paymentReference: { type: String, required: true, trim: true },
    paymentGatewayStatus: { type: String, required: false, trim: true },
    paymentGatewayResponse: { type: String, required: false, trim: true },
    paidAt: { type: Date, required: false },
  },
  { timestamps: true },
);

customOrderSchema.index({ paymentReference: 1 }, { unique: true });
customOrderSchema.index({ status: 1 });
customOrderSchema.index({ userId: 1, createdAt: -1 });

export type CustomOrderStatus = "Pending" | "Success" | "Failed";
export type CustomOrderModelType = InferSchemaType<typeof customOrderSchema>;

export const CustomOrderModel =
  (models.CustomOrder as Model<CustomOrderModelType> | undefined) ??
  model<CustomOrderModelType>("CustomOrder", customOrderSchema);
