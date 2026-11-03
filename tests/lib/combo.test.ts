import { describe, expect, it } from "vitest";

import {
  calculateComboDiscount,
  filterComboProducts,
  getDefaultComboSelection,
  isBottomCategory,
  isTopCategory,
  pairComboItems,
} from "@/lib/combo";

describe("combo categories", () => {
  it("recognises tops and bottoms regardless of case or spacing", () => {
    expect(isTopCategory(" tops ")).toBe(true);
    expect(isTopCategory("TOP")).toBe(true);
    expect(isBottomCategory("Skirts")).toBe(true);
    expect(isBottomCategory("pants")).toBe(true);
    expect(isBottomCategory("CAPRIS")).toBe(true);
    expect(isBottomCategory("MAXI")).toBe(false);
    expect(isTopCategory("MAXI")).toBe(false);
  });
});

describe("calculateComboDiscount", () => {
  it.each(["SKIRTS", "PANTS", "CAPRIS"])("gives one saving for a top and %s", (bottom) => {
    expect(calculateComboDiscount([{ category: "TOPS", quantity: 1 }, { category: bottom, quantity: 1 }])).toBe(20);
  });

  it("counts different bottoms towards pairs", () => {
    expect(
      calculateComboDiscount([
        { category: "TOPS", quantity: 2 },
        { category: "PANTS", quantity: 1 },
        { category: "CAPRIS", quantity: 1 },
      ]),
    ).toBe(40);
  });

  it("does not pair two bottoms together", () => {
    expect(calculateComboDiscount([{ category: "SKIRTS", quantity: 1 }, { category: "PANTS", quantity: 1 }])).toBe(0);
  });

  it("counts only complete pairs", () => {
    expect(calculateComboDiscount([{ category: "TOPS", quantity: 3 }, { category: "SKIRTS", quantity: 2 }])).toBe(40);
  });

  it("adds up separate tops and skirts", () => {
    expect(
      calculateComboDiscount([
        { category: "TOPS", quantity: 1 },
        { category: "TOPS", quantity: 1 },
        { category: "SKIRTS", quantity: 1 },
        { category: "SKIRTS", quantity: 1 },
      ]),
    ).toBe(40);
  });

  it("gives nothing without both pieces", () => {
    expect(calculateComboDiscount([{ category: "TOPS", quantity: 2 }])).toBe(0);
    expect(calculateComboDiscount([{ category: "SKIRTS", quantity: 2 }, { category: "MAXI", quantity: 2 }])).toBe(0);
    expect(calculateComboDiscount([])).toBe(0);
  });
});

describe("pairComboItems", () => {
  it("pairs a top with a bottom", () => {
    expect(
      pairComboItems([
        { sku: "TOP", category: "TOPS", quantity: 1 },
        { sku: "PANT", category: "PANTS", quantity: 1 },
      ]),
    ).toEqual([{ topSku: "TOP", bottomSku: "PANT", quantity: 1 }]);
  });

  it("splits quantities across different pieces", () => {
    expect(
      pairComboItems([
        { sku: "TOP", category: "TOPS", quantity: 3 },
        { sku: "SKIRT", category: "SKIRTS", quantity: 1 },
        { sku: "CAPRI", category: "CAPRIS", quantity: 1 },
      ]),
    ).toEqual([
      { topSku: "TOP", bottomSku: "SKIRT", quantity: 1 },
      { topSku: "TOP", bottomSku: "CAPRI", quantity: 1 },
    ]);
  });

  it("leaves unmatched and unrelated items out", () => {
    expect(
      pairComboItems([
        { sku: "TOP", category: "TOPS", quantity: 1 },
        { sku: "DRESS", category: "MAXI", quantity: 2 },
      ]),
    ).toEqual([]);
  });
});

describe("filterComboProducts", () => {
  const products = [
    { name: "Ijeoma Capris", category: "CAPRIS" },
    { name: "Wrap Skirt", category: "SKIRTS" },
    { name: "Wide Leg Pants", category: "PANTS" },
  ];
  const names = (query: string, category = "all") => filterComboProducts(products, query, category).map((p) => p.name);

  it("shows everything with no search or filter", () => {
    expect(names("")).toHaveLength(3);
    expect(names("   ")).toHaveLength(3);
  });

  it("searches names regardless of case and spacing", () => {
    expect(names("  ijeoma ")).toEqual(["Ijeoma Capris"]);
    expect(names("WRAP")).toEqual(["Wrap Skirt"]);
  });

  it("searches by type", () => {
    expect(names("pants")).toEqual(["Wide Leg Pants"]);
  });

  it("combines search with the type filter", () => {
    expect(names("", "SKIRTS")).toEqual(["Wrap Skirt"]);
    expect(names("ijeoma", "SKIRTS")).toEqual([]);
  });

  it("returns nothing when no product matches", () => {
    expect(names("zzz")).toEqual([]);
  });
});

describe("getDefaultComboSelection", () => {
  it("starts on the first in-stock option", () => {
    expect(
      getDefaultComboSelection([
        { color: "Wine", size: "S", stock: 0 },
        { color: "Black", size: "M", stock: 2 },
      ]),
    ).toEqual({ color: "Black", size: "M" });
  });

  it("falls back to the first option when all are sold out", () => {
    expect(getDefaultComboSelection([{ color: "Wine", size: "S", stock: 0 }])).toEqual({ color: "Wine", size: "S" });
  });

  it("handles a product without variants", () => {
    expect(getDefaultComboSelection([])).toEqual({ color: "", size: "" });
  });
});
