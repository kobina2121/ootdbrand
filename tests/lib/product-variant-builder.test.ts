import { describe, expect, it } from "vitest";

import { buildVariantRows } from "@/lib/product-variant-builder";

describe("buildVariantRows", () => {
  it("creates every selected size/color combination as its own variant row", () => {
    const result = buildVariantRows({
      selectedSizes: ["S", "M"],
      selectedColorCodes: ["#111827", "#F9FAFB"],
      colorOptions: [
        { name: "Black", code: "#111827" },
        { name: "White", code: "#F9FAFB" },
      ],
      existingVariants: [],
      slug: "silk-dress",
    });

    expect(result.skippedCount).toBe(0);
    expect(result.variants).toEqual([
      {
        size: "S",
        colorName: "Black",
        colorCode: "#111827",
        image: "",
        sku: "SILK-DRESS-S-BLACK",
        stock: 0,
      },
      {
        size: "S",
        colorName: "White",
        colorCode: "#F9FAFB",
        image: "",
        sku: "SILK-DRESS-S-WHITE",
        stock: 0,
      },
      {
        size: "M",
        colorName: "Black",
        colorCode: "#111827",
        image: "",
        sku: "SILK-DRESS-M-BLACK",
        stock: 0,
      },
      {
        size: "M",
        colorName: "White",
        colorCode: "#F9FAFB",
        image: "",
        sku: "SILK-DRESS-M-WHITE",
        stock: 0,
      },
    ]);
  });

  it("skips combinations that already exist", () => {
    const result = buildVariantRows({
      selectedSizes: ["S", "M"],
      selectedColorCodes: ["#111827"],
      colorOptions: [{ name: "Black", code: "#111827" }],
      existingVariants: [
        {
          size: "S",
          colorName: "Black",
          colorCode: "#111827",
          image: "",
          sku: "SILK-DRESS-S-BLACK",
          stock: 3,
        },
      ],
      slug: "silk-dress",
    });

    expect(result.skippedCount).toBe(1);
    expect(result.variants).toEqual([
      {
        size: "M",
        colorName: "Black",
        colorCode: "#111827",
        image: "",
        sku: "SILK-DRESS-M-BLACK",
        stock: 0,
      },
    ]);
  });
});
