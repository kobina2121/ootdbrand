import { describe, expect, it } from "vitest";

import { buildVariantRows, getColorPhotoRows } from "@/lib/product-variant-builder";

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

describe("getColorPhotoRows", () => {
  const variant = (colorName: string, image?: string) => ({ colorName, colorCode: "#111827", image });

  it("groups every size of a colour into one row", () => {
    expect(getColorPhotoRows([variant("Black", "/black.jpg"), variant("Black", "/black.jpg"), variant("White", "/white.jpg")])).toEqual([
      { colorName: "Black", colorCode: "#111827", image: "/black.jpg", isMixed: false },
      { colorName: "White", colorCode: "#111827", image: "/white.jpg", isMixed: false },
    ]);
  });

  it("treats a colour with no photo as empty", () => {
    expect(getColorPhotoRows([variant("Black"), variant("Black", "")])[0]).toMatchObject({ image: "", isMixed: false });
  });

  it("flags a colour whose sizes use different photos", () => {
    expect(getColorPhotoRows([variant("Black", "/a.jpg"), variant("Black", "/b.jpg")])[0]).toMatchObject({ image: "", isMixed: true });
  });

  it("skips rows without a colour name", () => {
    expect(getColorPhotoRows([variant("  ")])).toEqual([]);
  });
});
