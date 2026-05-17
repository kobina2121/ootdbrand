import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

const paymentEventSchema = new Schema(
  {
    reference: { type: String, required: true, trim: true },
    eventType: { type: String, required: true, trim: true },
    eventKey: { type: String, required: true, trim: true },
    payload: { type: Schema.Types.Mixed, required: true },
    verified: { type: Boolean, default: false, required: true },
  },
  { timestamps: true },
);

paymentEventSchema.index({ reference: 1 });
paymentEventSchema.index({ eventType: 1 });
paymentEventSchema.index({ eventKey: 1 }, { unique: true });

export type PaymentEventModelType = InferSchemaType<typeof paymentEventSchema>;

export const PaymentEventModel =
  (models.PaymentEvent as Model<PaymentEventModelType> | undefined) ??
  model<PaymentEventModelType>("PaymentEvent", paymentEventSchema);
