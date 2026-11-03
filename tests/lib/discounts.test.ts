import { afterEach, describe, expect, it } from "vitest";

import { normalizeDiscountCode, resolveBestDiscount, resolveDiscount } from "@/lib/discounts";
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
    expect(normalizeDiscountCode(" ootd10 ")).toBe("OOTD10");
    expect(normalizeDiscountCode("")).toBeNull();
  });

  it("applies percentage discount rules", () => {
    process.env.STORE_DISCOUNT_CODES = JSON.stringify([
      { code: "OOTD10", type: "percentage", value: 10 },
    ]);

    expect(resolveDiscount(items, "ootd10")).toEqual({
      requestedCode: "OOTD10",
      appliedCode: "OOTD10",
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
      { code: "OOTD10", type: "percentage", value: 10 },
    ]);

    expect(resolveDiscount(items, "NOPE")).toEqual({
      requestedCode: "NOPE",
      appliedCode: null,
      amount: 0,
      message: "Coupon code is invalid or inactive.",
    });
  });
});

describe("best discount resolution", () => {
  const coupon = (value: number) => {
    process.env.STORE_DISCOUNT_CODES = JSON.stringify([{ code: "OOTD", type: "fixed", value }]);
  };

  it("applies the combo saving when there is no coupon", () => {
    expect(resolveBestDiscount(items, null, 20)).toMatchObject({ amount: 20, comboApplied: true, appliedCode: null, notice: null });
  });

  it("uses the combo saving and explains why when it beats a valid coupon", () => {
    coupon(10);

    const result = resolveBestDiscount(items, "OOTD", 20);

    expect(result).toMatchObject({ amount: 20, comboApplied: true, appliedCode: null, requestedCode: "OOTD", message: null });
    expect(result.notice).toContain("combo saving");
  });

  it("uses the coupon when it beats or matches the combo saving", () => {
    coupon(50);
    expect(resolveBestDiscount(items, "OOTD", 20)).toMatchObject({ amount: 50, comboApplied: false, appliedCode: "OOTD" });

    coupon(20);
    expect(resolveBestDiscount(items, "OOTD", 20)).toMatchObject({ amount: 20, comboApplied: false, appliedCode: "OOTD" });
  });

  it("keeps the invalid coupon message alongside the combo saving", () => {
    expect(resolveBestDiscount(items, "NOPE", 20)).toMatchObject({
      amount: 20,
      comboApplied: true,
      message: "Coupon code is invalid or inactive.",
    });
  });

  it("never discounts more than the subtotal", () => {
    expect(resolveBestDiscount(items, null, 500).amount).toBe(240);
  });

  it("gives no discount without a combo or coupon", () => {
    expect(resolveBestDiscount(items, null, 0)).toMatchObject({ amount: 0, comboApplied: false });
  });
});
