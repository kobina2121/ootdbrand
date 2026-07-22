import { Types } from "mongoose";
import { unstable_noStore as noStore } from "next/cache";

import { connectToDatabase } from "@/lib/db/mongoose";
import { OrderModel } from "@/lib/db/models/order";
import { ProductModel } from "@/lib/db/models/product";
import { ProductReviewModel } from "@/lib/db/models/product-review";
import { getProductSlugLookupCandidates, normalizeProductSlug } from "@/lib/product-slug";
import { type CartItem, type Product } from "@/lib/products";

export type ProductFilters = {
  activeOnly?: boolean;
  category?: string;
  sort?: "latest" | "price-asc" | "price-desc";
};

export type AdminProductListFilters = {
  q?: string;
  status?: "all" | "active" | "inactive";
  page?: number;
  pageSize?: number;
};

export type ProductVariantStockCheck = {
  sku: string;
  quantity: number;
};

export type ResolvedOrderItem = {
  productId: string;
  productNameSnapshot: string;
  variant: {
    size: string;
    color: {
      name: string;
      code: string;
    };
    sku: string;
  };
  unitPrice: number;
  quantity: number;
};

type VariantSalesStats = {
  soldQuantity: number;
  orderCount: number;
};

type ProductReviewStats = {
  rating: number;
  reviewCount: number;
};

type StorefrontVariant = {
  name?: string | null;
  size: string;
  color?: { name?: string; code?: string } | null;
  image?: string | null;
  sku: string;
  stock: number;
  priceOverride?: number | null;
};

function normalizeSku(value: string) {
  return value.trim().toUpperCase();
}

function normalizeReviewSlug(value: string) {
  return value.trim().toLowerCase();
}

function getAllVariantSkus<T extends { variants?: Array<{ sku: string }> }>(docs: T[]) {
  return docs.flatMap((doc) => doc.variants?.map((variant) => variant.sku) ?? []);
}

async function getSuccessfulVariantSalesBySku(skus: string[]) {
  const normalizedSkus = Array.from(new Set(skus.map(normalizeSku).filter(Boolean)));

  if (normalizedSkus.length === 0) {
    return new Map<string, VariantSalesStats>();
  }

  const rows = await OrderModel.aggregate<{
    _id: string;
    soldQuantity: number;
    orderCount: number;
  }>([
    { $match: { status: "Success", "items.variant.sku": { $in: normalizedSkus } } },
    { $unwind: "$items" },
    { $match: { "items.variant.sku": { $in: normalizedSkus } } },
    {
      $group: {
        _id: "$items.variant.sku",
        soldQuantity: { $sum: "$items.quantity" },
        orderCount: { $sum: 1 },
      },
    },
  ]);

  return new Map(
    rows.map((row) => [
      normalizeSku(row._id),
      {
        soldQuantity: row.soldQuantity,
        orderCount: row.orderCount,
      },
    ]),
  );
}

async function getApprovedReviewStatsBySlug(slugs: string[]) {
  const normalizedSlugs = Array.from(new Set(slugs.map(normalizeReviewSlug).filter(Boolean)));

  if (normalizedSlugs.length === 0) {
    return new Map<string, ProductReviewStats>();
  }

  const rows = await ProductReviewModel.aggregate<{
    _id: string;
    rating: number;
    reviewCount: number;
  }>([
    { $match: { isApproved: true, productSlug: { $in: normalizedSlugs } } },
    {
      $group: {
        _id: "$productSlug",
        rating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  return new Map(
    rows.map((row) => [
      normalizeReviewSlug(row._id),
      {
        rating: row.rating,
        reviewCount: row.reviewCount,
      },
    ]),
  );
}

function mapVariantForStorefront(variant: StorefrontVariant, salesBySku: Map<string, VariantSalesStats>) {
  const sales = salesBySku.get(normalizeSku(variant.sku));
  const stockOnHand = variant.stock;
  const soldQuantity = sales?.soldQuantity ?? 0;

  return {
    name: variant.name?.trim() || undefined,
    size: variant.size,
    color: variant.color?.name ?? "Unknown",
    colorCode: variant.color?.code ?? "#9CA3AF",
    image: variant.image ?? undefined,
    sku: variant.sku,
    stock: Math.max(0, stockOnHand - soldQuantity),
    stockOnHand,
    soldQuantity,
    orderCount: sales?.orderCount ?? 0,
    priceOverride: variant.priceOverride ?? undefined,
  };
}

function getProductInventoryStats<T extends { variants: StorefrontVariant[] }>(
  doc: T,
  salesBySku: Map<string, VariantSalesStats>,
) {
  return doc.variants.reduce(
    (stats, variant) => {
      const sales = salesBySku.get(normalizeSku(variant.sku));
      const soldQuantity = sales?.soldQuantity ?? 0;

      return {
        stockOnHand: stats.stockOnHand + variant.stock,
        availableStock: stats.availableStock + Math.max(0, variant.stock - soldQuantity),
        soldQuantity: stats.soldQuantity + soldQuantity,
        orderCount: stats.orderCount + (sales?.orderCount ?? 0),
      };
    },
    { stockOnHand: 0, availableStock: 0, soldQuantity: 0, orderCount: 0 },
  );
}

function toUiProduct(
  doc: Awaited<ReturnType<typeof ProductModel.findOne>>,
  salesBySku: Map<string, VariantSalesStats> = new Map(),
  reviewStatsBySlug: Map<string, ProductReviewStats> = new Map(),
) {
  if (!doc) {
    return null;
  }

  const reviewStats = reviewStatsBySlug.get(normalizeReviewSlug(doc.slug));

  return {
    slug: doc.slug,
    name: doc.name,
    category: doc.category,
    description: doc.description,
    basePrice: doc.basePrice,
    image: doc.images[0] ?? "",
    images: doc.images ?? [],
    variants: doc.variants.map((variant) => mapVariantForStorefront(variant, salesBySku)),
    rating: reviewStats?.rating ?? 0,
    reviewCount: reviewStats?.reviewCount ?? 0,
  } satisfies Product;
}

function sortProducts(items: Product[], sort: ProductFilters["sort"]) {
  if (sort === "price-asc") {
    return [...items].sort((a, b) => a.basePrice - b.basePrice);
  }

  if (sort === "price-desc") {
    return [...items].sort((a, b) => b.basePrice - a.basePrice);
  }

  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

export async function listProducts(filters: ProductFilters = {}) {
  noStore();
  await connectToDatabase();

  const query: Record<string, unknown> = {};

  if (filters.activeOnly) {
    query.isActive = true;
  }

  if (filters.category && filters.category.toLowerCase() !== "all") {
    query.category = new RegExp(`^${filters.category}$`, "i");
  }

  const docs = await ProductModel.find(query).lean();
  const [salesBySku, reviewStatsBySlug] = await Promise.all([
    getSuccessfulVariantSalesBySku(getAllVariantSkus(docs)),
    getApprovedReviewStatsBySlug(docs.map((doc) => doc.slug)),
  ]);
  const mapped = docs.map((doc) => ({
    slug: doc.slug,
    name: doc.name,
    category: doc.category,
    description: doc.description,
    basePrice: doc.basePrice,
    image: doc.images[0] ?? "",
    images: doc.images ?? [],
    variants: doc.variants.map((variant) => mapVariantForStorefront(variant, salesBySku)),
    rating: reviewStatsBySlug.get(normalizeReviewSlug(doc.slug))?.rating ?? 0,
    reviewCount: reviewStatsBySlug.get(normalizeReviewSlug(doc.slug))?.reviewCount ?? 0,
  })) satisfies Product[];

  return sortProducts(mapped, filters.sort);
}

export async function getProductBySlug(slug: string) {
  noStore();
  await connectToDatabase();

  const doc = await ProductModel.findOne({ slug: { $in: getProductSlugLookupCandidates(slug) } });
  const [salesBySku, reviewStatsBySlug] = doc
    ? await Promise.all([
        getSuccessfulVariantSalesBySku(doc.variants.map((variant) => variant.sku)),
        getApprovedReviewStatsBySlug([doc.slug]),
      ])
    : [new Map<string, VariantSalesStats>(), new Map<string, ProductReviewStats>()];

  return toUiProduct(doc, salesBySku, reviewStatsBySlug);
}

export async function getProductById(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  noStore();
  await connectToDatabase();
  const doc = await ProductModel.findById(id).lean();

  if (!doc) {
    return null;
  }

  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    category: doc.category,
    tags: doc.tags ?? [],
    basePrice: doc.basePrice,
    images: doc.images,
    variants: doc.variants,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function createProduct(payload: {
  name: string;
  slug: string;
  description: string;
  category: string;
  tags?: string[];
  basePrice: number;
  images: string[];
  variants: Array<{
    name?: string;
    size: string;
    color: { name: string; code: string };
    image?: string;
    sku: string;
    priceOverride?: number;
    stock: number;
  }>;
  isActive: boolean;
}) {
  await connectToDatabase();
  const created = await ProductModel.create({ ...payload, slug: normalizeProductSlug(payload.slug) });

  return {
    id: String(created._id),
    slug: created.slug,
  };
}

export async function updateProductById(
  id: string,
  payload: Partial<{
    name: string;
    slug: string;
    description: string;
    category: string;
    tags: string[];
    basePrice: number;
    images: string[];
    variants: Array<{
      name?: string;
      size: string;
      color: { name: string; code: string };
      image?: string;
      sku: string;
      priceOverride?: number;
      stock: number;
    }>;
    isActive: boolean;
  }>,
) {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectToDatabase();
  const update = payload.slug ? { ...payload, slug: normalizeProductSlug(payload.slug) } : payload;
  const updated = await ProductModel.findByIdAndUpdate(id, update, { returnDocument: "after" }).lean();

  if (!updated) {
    return null;
  }

  return {
    id: String(updated._id),
    slug: updated.slug,
  };
}

export async function deleteProductById(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    return false;
  }

  await connectToDatabase();
  const deleted = await ProductModel.findByIdAndDelete(id);
  return Boolean(deleted);
}

export async function resolveOrderItemsFromCart(items: CartItem[]): Promise<ResolvedOrderItem[]> {
  noStore();
  await connectToDatabase();

  const skus = items.map((item) => item.sku);
  const docs = await ProductModel.find({ "variants.sku": { $in: skus } }).lean();
  const salesBySku = await getSuccessfulVariantSalesBySku(skus);

  const variantMap = new Map<
    string,
    {
      productId: string;
      productNameSnapshot: string;
      size: string;
      color: { name: string; code: string };
      sku: string;
      stock: number;
      unitPrice: number;
    }
  >();

  docs.forEach((doc) => {
    doc.variants.forEach((variant) => {
      variantMap.set(variant.sku, {
        productId: String(doc._id),
        productNameSnapshot: variant.name?.trim() || doc.name,
        size: variant.size,
        color: {
          name: variant.color?.name ?? "Unknown",
          code: variant.color?.code ?? "#374151",
        },
        sku: variant.sku,
        stock: Math.max(0, variant.stock - (salesBySku.get(normalizeSku(variant.sku))?.soldQuantity ?? 0)),
        unitPrice: variant.priceOverride ?? doc.basePrice,
      });
    });
  });

  return items.map((item) => {
    const found = variantMap.get(item.sku);

    if (!found) {
      throw new Error(`Variant not found: ${item.sku}`);
    }

    if (found.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${item.sku}`);
    }

    return {
      productId: found.productId,
      productNameSnapshot: found.productNameSnapshot,
      variant: {
        size: found.size,
        color: found.color,
        sku: found.sku,
      },
      unitPrice: found.unitPrice,
      quantity: item.quantity,
    };
  });
}

export async function listProductsForAdmin() {
  noStore();
  await connectToDatabase();

  const docs = await ProductModel.find().sort({ createdAt: -1 }).lean();
  const salesBySku = await getSuccessfulVariantSalesBySku(getAllVariantSkus(docs));

  return docs.map((doc) => {
    const inventory = getProductInventoryStats(doc, salesBySku);

    return {
      id: String(doc._id),
      name: doc.name,
      category: doc.category,
      slug: doc.slug,
      isActive: doc.isActive,
      variantsCount: doc.variants.length,
      stockOnHand: inventory.stockOnHand,
      availableStock: inventory.availableStock,
      soldQuantity: inventory.soldQuantity,
      orderCount: inventory.orderCount,
      updatedAt: doc.updatedAt,
    };
  });
}

export async function listProductsForAdminPaged(filters: AdminProductListFilters = {}) {
  const page = Math.max(1, Number.isFinite(filters.page) ? Number(filters.page) : 1);
  const pageSize = Math.min(50, Math.max(1, Number.isFinite(filters.pageSize) ? Number(filters.pageSize) : 10));
  const q = (filters.q ?? "").trim();
  const status = filters.status ?? "all";

  noStore();
  await connectToDatabase();

  const query: Record<string, unknown> = {};

  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escaped, "i");

    query.$or = [{ name: searchRegex }, { category: searchRegex }, { slug: searchRegex }];
  }

  if (status === "active") {
    query.isActive = true;
  } else if (status === "inactive") {
    query.isActive = false;
  }

  const [docs, totalCount] = await Promise.all([
    ProductModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    ProductModel.countDocuments(query),
  ]);
  const salesBySku = await getSuccessfulVariantSalesBySku(getAllVariantSkus(docs));

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);

  return {
    products: docs.map((doc) => {
      const inventory = getProductInventoryStats(doc, salesBySku);

      return {
        id: String(doc._id),
        name: doc.name,
        category: doc.category,
        slug: doc.slug,
        isActive: doc.isActive,
        variantsCount: doc.variants.length,
        stockOnHand: inventory.stockOnHand,
        availableStock: inventory.availableStock,
        soldQuantity: inventory.soldQuantity,
        orderCount: inventory.orderCount,
        updatedAt: doc.updatedAt,
      };
    }),
    pagination: {
      page: safePage,
      pageSize,
      totalCount,
      totalPages,
    },
  };
}
