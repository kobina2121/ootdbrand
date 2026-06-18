import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productNameSnapshot: { type: String, required: true, trim: true },
    variant: {
      size: { type: String, required: true, trim: true },
      color: {
        name: { type: String, required: true, trim: true },
        code: { type: String, required: true, trim: true },
      },
      sku: { type: String, required: true, trim: true },
    },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const shippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    items: { type: [orderItemSchema], required: true, default: [] },
    amountSubtotal: { type: Number, required: true, min: 0 },
    discountCode: { type: String, required: false, trim: true, uppercase: true },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    transactionFee: { type: Number, required: true, min: 0, default: 0 },
    amountTotal: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "GHS", required: true },
    status: {
      type: String,
      enum: ["Pending", "Success", "Failed"],
      default: "Pending",
      required: true,
    },
    deliveryStatus: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
      required: true,
    },
    trackingNumber: { type: String, required: false, trim: true },
    trackingUrl: { type: String, required: false, trim: true },
    adminUpdate: { type: String, required: false, trim: true },
    paymentProvider: { type: String, default: "paystack", required: true },
    paymentReference: { type: String, required: true, trim: true },
    paymentGatewayStatus: { type: String, required: false, trim: true },
    paymentGatewayResponse: { type: String, required: false, trim: true },
    paidAt: { type: Date, required: false },
    shippingAddress: { type: shippingAddressSchema, required: true },
  },
  { timestamps: true },
);

orderSchema.index({ paymentReference: 1 }, { unique: true });
orderSchema.index({ status: 1 });

export type OrderStatus = "Pending" | "Success" | "Failed";
export type OrderModelType = InferSchemaType<typeof orderSchema>;

export const OrderModel =
  (models.Order as Model<OrderModelType> | undefined) ??
  model<OrderModelType>("Order", orderSchema);
