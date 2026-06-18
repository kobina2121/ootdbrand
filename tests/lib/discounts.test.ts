import { afterEach, describe, expect, it } from "vitest";

import { normalizeDiscountCode, resolveDiscount } from "@/lib/discounts";
import type { CartItem } from "@/lib/products";

const items: CartItem[] = [
  {
    slug: "arc-hoodie",
    name: "Arc Hoodie",
    image: "/images/arc-hoodie.jpg",
    size: "M",
    color: "Black",
    sku: "ARC-HOODIE-BLK-M",
    quantity: 2,
    unitPrice: 120,
  },
];

afterEach(() => {
  delete process.env.STORE_DISCOUNT_CODES;
});

describe("discount resolution", () => {
  it("normalizes coupon codes before lookup", () => {
    expect(normalizeDiscountCode(" tide10 ")).toBe("TIDE10");
    expect(normalizeDiscountCode("")).toBeNull();
  });

  it("applies percentage discount rules", () => {
    process.env.STORE_DISCOUNT_CODES = JSON.stringify([
      { code: "TIDE10", type: "percentage", value: 10 },
    ]);

    expect(resolveDiscount(items, "tide10")).toEqual({
      requestedCode: "TIDE10",
      appliedCode: "TIDE10",
      amount: 24,
      message: null,
    });
  });

  it("rejects discounts that do not meet the minimum subtotal", () => {
    process.env.STORE_DISCOUNT_CODES = JSON.stringify([
      { code: "WELCOME500", type: "fixed", value: 500, minimumSubtotal: 5000 },
    ]);

    expect(resolveDiscount(items, "WELCOME500")).toEqual({
      requestedCode: "WELCOME500",
      appliedCode: null,
      amount: 0,
      message: "Coupon requires a minimum order of 5000 GHS.",
    });
  });

  it("returns an invalid result for unknown codes", () => {
    process.env.STORE_DISCOUNT_CODES = JSON.stringify([
      { code: "TIDE10", type: "percentage", value: 10 },
    ]);

    expect(resolveDiscount(items, "NOPE")).toEqual({
      requestedCode: "NOPE",
      appliedCode: null,
      amount: 0,
      message: "Coupon code is invalid or inactive.",
    });
  });
});
