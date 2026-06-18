import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    pendingEmail: { type: String, required: false, trim: true, lowercase: true },
    pendingEmailChangeTokenHash: { type: String, required: false },
    pendingEmailChangeExpiresAt: { type: Date, required: false },
    passwordHash: { type: String, required: false },
    resetPasswordTokenHash: { type: String, required: false },
    resetPasswordExpiresAt: { type: Date, required: false },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
      required: true,
    },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ pendingEmail: 1 }, { unique: true, sparse: true });

export type UserRole = "customer" | "admin";
export type UserModelType = InferSchemaType<typeof userSchema>;

export const UserModel =
  (models.User as Model<UserModelType> | undefined) ??
  model<UserModelType>("User", userSchema);
