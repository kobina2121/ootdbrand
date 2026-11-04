import { describe, expect, it } from "vitest";

import { findInitialVariant, type ProductVariant } from "@/lib/products";

const variant = (color: string, size: string, stock = 5): ProductVariant => ({
  color,
  size,
  stock,
  sku: `${color}-${size}`,
});

const variants = [variant("Black", "S", 0), variant("Black", "M"), variant("Red", "S", 0), variant("Red", "M"), variant("Red", "L")];

describe("findInitialVariant", () => {
  it("opens on the first in-stock option by default", () => {
    expect(findInitialVariant(variants)?.sku).toBe("Black-M");
  });

  it("opens on the requested color, whatever its case", () => {
    expect(findInitialVariant(variants, { color: "red" })?.sku).toBe("Red-M");
  });

  it("uses the requested size when it is in stock", () => {
    expect(findInitialVariant(variants, { size: "L" })?.sku).toBe("Red-L");
    expect(findInitialVariant(variants, { color: "Red", size: "L" })?.sku).toBe("Red-L");
  });

  it("still shows a sold out requested size so customers can see it", () => {
    expect(findInitialVariant(variants, { color: "Red", size: "S" })?.sku).toBe("Red-S");
  });

  it("ignores a color the product does not have", () => {
    expect(findInitialVariant(variants, { color: "Green" })?.sku).toBe("Black-M");
  });

  it("handles a product with no options", () => {
    expect(findInitialVariant([])).toBeUndefined();
  });
});
