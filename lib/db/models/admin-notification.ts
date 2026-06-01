import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

const adminNotificationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["store-order", "custom-order"],
      required: true,
      trim: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, required: true, trim: true },
    unread: { type: Boolean, required: true, default: true },
    metadata: { type: Schema.Types.Mixed, required: false },
  },
  { timestamps: true },
);

adminNotificationSchema.index({ unread: 1, createdAt: -1 });

export type AdminNotificationModelType = InferSchemaType<typeof adminNotificationSchema>;

export const AdminNotificationModel =
  (models.AdminNotification as Model<AdminNotificationModelType> | undefined) ??
  model<AdminNotificationModelType>("AdminNotification", adminNotificationSchema);
