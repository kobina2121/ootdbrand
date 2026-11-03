export const COMBO_DISCOUNT_GHS = 20;
export const COMBO_DISCOUNT_LABEL = "COMBO";

const TOP_CATEGORIES = new Set(["TOP", "TOPS"]);
const BOTTOM_CATEGORIES = new Set(["SKIRT", "SKIRTS", "PANT", "PANTS", "CAPRI", "CAPRIS"]);

function normalizeCategory(category: string) {
  return category.trim().toUpperCase();
}

export function isTopCategory(category: string) {
  return TOP_CATEGORIES.has(normalizeCategory(category));
}

export function isBottomCategory(category: string) {
  return BOTTOM_CATEGORIES.has(normalizeCategory(category));
}

export function calculateComboDiscount(items: Array<{ category: string; quantity: number }>) {
  let topCount = 0;
  let bottomCount = 0;

  items.forEach((item) => {
    if (isTopCategory(item.category)) {
      topCount += item.quantity;
    } else if (isBottomCategory(item.category)) {
      bottomCount += item.quantity;
    }
  });

  return Math.min(topCount, bottomCount) * COMBO_DISCOUNT_GHS;
}

export type ComboPair = {
  topSku: string;
  bottomSku: string;
  quantity: number;
};

export function pairComboItems(items: Array<{ sku: string; category: string; quantity: number }>) {
  const tops = items.filter((item) => isTopCategory(item.category)).map((item) => ({ ...item }));
  const bottoms = items.filter((item) => isBottomCategory(item.category)).map((item) => ({ ...item }));
  const pairs: ComboPair[] = [];
  let topIndex = 0;
  let bottomIndex = 0;

  while (topIndex < tops.length && bottomIndex < bottoms.length) {
    const top = tops[topIndex];
    const bottom = bottoms[bottomIndex];
    const quantity = Math.min(top.quantity, bottom.quantity);

    if (quantity > 0) {
      pairs.push({ topSku: top.sku, bottomSku: bottom.sku, quantity });
    }

    top.quantity -= quantity;
    bottom.quantity -= quantity;

    if (top.quantity === 0) {
      topIndex += 1;
    }

    if (bottom.quantity === 0) {
      bottomIndex += 1;
    }
  }

  return pairs;
}

export function filterComboProducts<T extends { name: string; category: string }>(
  products: T[],
  query: string,
  category: string,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return products.filter(
    (product) =>
      (category === "all" || product.category === category) &&
      (normalizedQuery === "" ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery)),
  );
}

type SelectableVariant = {
  size: string;
  color: string;
  stock: number;
};

// Starts on an option customers can actually buy, falling back to the first listed one.
export function getDefaultComboSelection(variants: SelectableVariant[]) {
  const variant = variants.find((entry) => entry.stock > 0) ?? variants[0];

  return { color: variant?.color ?? "", size: variant?.size ?? "" };
}
