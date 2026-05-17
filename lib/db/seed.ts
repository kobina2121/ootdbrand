import { products as staticProducts } from "@/lib/products";
import { ProductModel } from "@/lib/db/models/product";

const colorCodeMap: Record<string, string> = {
  black: "#111827",
  white: "#F8FAFC",
  olive: "#4D7C0F",
  khaki: "#A16207",
  navy: "#1E3A8A",
  stone: "#78716C",
  cream: "#E7E5E4",
  blue: "#2563EB",
  grey: "#6B7280",
};

let didSeedCheck = false;

export async function seedProductsIfEmpty() {
  if (didSeedCheck) {
    return;
  }

  const count = await ProductModel.estimatedDocumentCount();

  if (count > 0) {
    didSeedCheck = true;
    return;
  }

  await ProductModel.insertMany(
    staticProducts.map((entry) => ({
      name: entry.name,
      slug: entry.slug,
      description: entry.description,
      category: entry.category,
      tags: [entry.category.toLowerCase()],
      basePrice: entry.basePrice,
      images: [entry.image],
      isActive: true,
      variants: entry.variants.map((variant) => ({
        size: variant.size,
        color: {
          name: variant.color,
          code: colorCodeMap[variant.color.toLowerCase()] ?? "#374151",
        },
        sku: variant.sku,
        priceOverride: variant.priceOverride,
        stock: variant.stock,
      })),
    })),
    { ordered: false },
  );

  didSeedCheck = true;
}
