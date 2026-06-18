import { z } from "zod";

export const discountCodeSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const normalized = value.trim().toUpperCase();
    return normalized.length > 0 ? normalized : undefined;
  },
  z.union([z.string().min(3).max(32).regex(/^[A-Z0-9_-]+$/), z.undefined()]),
);
