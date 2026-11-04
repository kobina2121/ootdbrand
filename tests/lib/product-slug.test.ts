import { describe, expect, it } from "vitest";

import {
  encodeProductSlugForPath,
  getProductSlugLookupCandidates,
  normalizeProductSlug, buildProductHref } from "@/lib/product-slug";

describe("product slug helpers", () => {
  it("normalizes admin-entered product names into URL-safe slugs", () => {
    expect(normalizeProductSlug("  Yellow Summer Dress! ")).toBe("yellow-summer-dress");
    expect(normalizeProductSlug("Top & Skirt Set")).toBe("top-and-skirt-set");
  });

  it("encodes unsafe legacy slugs for product detail links", () => {
    expect(encodeProductSlugForPath("yellow dress")).toBe("yellow%20dress");
    expect(encodeProductSlugForPath("tops/yellow")).toBe("tops%2Fyellow");
  });

  it("builds lookup candidates for old encoded and new normalized slugs", () => {
    expect(getProductSlugLookupCandidates("Yellow%20Dress")).toEqual([
      "yellow%20dress",
      "yellow dress",
      "yellow-20dress",
      "yellow-dress",
    ]);
  });
});

describe("buildProductHref", () => {
  it("links to the product with no options", () => {
    expect(buildProductHref("square-top")).toBe("/products/square-top");
  });

  it("carries the chosen color and size", () => {
    expect(buildProductHref("skirt", { color: "Hot Pink" })).toBe("/products/skirt?color=Hot+Pink");
    expect(buildProductHref("skirt", { size: "M" })).toBe("/products/skirt?size=M");
  });
});
