export type VariantColorOption = {
  name: string;
  code: string;
};

export type ProductVariantDraft = {
  size: string;
  colorName: string;
  colorCode: string;
  image?: string;
  sku: string;
  stock: number;
};

type BuildVariantRowsInput = {
  selectedSizes: string[];
  selectedColorCodes: string[];
  colorOptions: VariantColorOption[];
  existingVariants: ProductVariantDraft[];
  slug: string;
};

function normalizeSlugBase(slug: string) {
  return slug
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toVariantKey(size: string, colorCode: string) {
  return `${size.trim().toUpperCase()}__${colorCode.trim().toUpperCase()}`;
}

function toColorSkuPart(colorName: string) {
  return colorName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 12);
}

export function buildVariantRows({
  selectedSizes,
  selectedColorCodes,
  colorOptions,
  existingVariants,
  slug,
}: BuildVariantRowsInput) {
  const existingVariantKeys = new Set(
    existingVariants.map((variant) => toVariantKey(variant.size, variant.colorCode)),
  );
  const existingSkus = new Set(existingVariants.map((variant) => variant.sku.trim().toUpperCase()));
  const slugBase = normalizeSlugBase(slug);
  const variants: ProductVariantDraft[] = [];
  let skippedCount = 0;

  selectedSizes.forEach((size) => {
    selectedColorCodes.forEach((colorCode) => {
      const color = colorOptions.find((entry) => entry.code.toUpperCase() === colorCode.toUpperCase());

      if (!color) {
        skippedCount += 1;
        return;
      }

      const variantKey = toVariantKey(size, color.code);
      if (existingVariantKeys.has(variantKey)) {
        skippedCount += 1;
        return;
      }

      const colorSkuPart = toColorSkuPart(color.name);
      let nextSku = `${slugBase || "PRODUCT"}-${size}-${colorSkuPart || "CLR"}`;
      let counter = 2;

      while (existingSkus.has(nextSku)) {
        nextSku = `${slugBase || "PRODUCT"}-${size}-${colorSkuPart || "CLR"}-${counter}`;
        counter += 1;
      }

      existingVariantKeys.add(variantKey);
      existingSkus.add(nextSku);
      variants.push({
        size,
        colorName: color.name,
        colorCode: color.code,
        image: "",
        sku: nextSku,
        stock: 0,
      });
    });
  });

  return {
    variants,
    skippedCount,
  };
}
