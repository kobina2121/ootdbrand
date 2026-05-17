import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/mongoose";
import { ProductModel } from "@/lib/db/models/product";
import { seedProductsIfEmpty } from "@/lib/db/seed";
import { products as fallbackProducts, type CartItem, type Product } from "@/lib/products";

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

function toUiProduct(doc: Awaited<ReturnType<typeof ProductModel.findOne>>) {
  if (!doc) {
    return null;
  }

  return {
    slug: doc.slug,
    name: doc.name,
    category: doc.category,
    description: doc.description,
    basePrice: doc.basePrice,
    image: doc.images[0] ?? "",
    variants: doc.variants.map((variant) => ({
      size: variant.size,
      color: variant.color?.name ?? "Unknown",
      colorCode: variant.color?.code ?? "#9CA3AF",
      image: variant.image ?? undefined,
      sku: variant.sku,
      stock: variant.stock,
      priceOverride: variant.priceOverride ?? undefined,
    })),
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
  try {
    await connectToDatabase();
    await seedProductsIfEmpty();

    const query: Record<string, unknown> = {};

    if (filters.activeOnly) {
      query.isActive = true;
    }

    if (filters.category && filters.category.toLowerCase() !== "all") {
      query.category = new RegExp(`^${filters.category}$`, "i");
    }

    const docs = await ProductModel.find(query).lean();
    const mapped = docs.map((doc) => ({
      slug: doc.slug,
      name: doc.name,
      category: doc.category,
      description: doc.description,
      basePrice: doc.basePrice,
      image: doc.images[0] ?? "",
      variants: doc.variants.map((variant) => ({
        size: variant.size,
        color: variant.color?.name ?? "Unknown",
        colorCode: variant.color?.code ?? "#9CA3AF",
        image: variant.image ?? undefined,
        sku: variant.sku,
        stock: variant.stock,
        priceOverride: variant.priceOverride ?? undefined,
      })),
    })) satisfies Product[];

    return sortProducts(mapped, filters.sort);
  } catch {
    // Keep storefront usable if DB is temporarily unavailable.
    const items =
      filters.category && filters.category.toLowerCase() !== "all"
        ? fallbackProducts.filter((product) => product.category.toLowerCase() === filters.category?.toLowerCase())
        : fallbackProducts;

    return sortProducts(items, filters.sort);
  }
}

export async function getProductBySlug(slug: string) {
  try {
    await connectToDatabase();
    await seedProductsIfEmpty();

    const doc = await ProductModel.findOne({ slug: slug.toLowerCase() });
    return toUiProduct(doc);
  } catch {
    return fallbackProducts.find((product) => product.slug === slug) ?? null;
  }
}

export async function getProductById(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

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
  const created = await ProductModel.create({ ...payload, slug: payload.slug.toLowerCase() });

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
  const update = payload.slug ? { ...payload, slug: payload.slug.toLowerCase() } : payload;
  const updated = await ProductModel.findByIdAndUpdate(id, update, { new: true }).lean();

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
  await connectToDatabase();
  await seedProductsIfEmpty();

  const skus = items.map((item) => item.sku);
  const docs = await ProductModel.find({ "variants.sku": { $in: skus } }).lean();

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
        productNameSnapshot: doc.name,
        size: variant.size,
        color: {
          name: variant.color?.name ?? "Unknown",
          code: variant.color?.code ?? "#374151",
        },
        sku: variant.sku,
        stock: variant.stock,
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
  try {
    await connectToDatabase();
    await seedProductsIfEmpty();

    const docs = await ProductModel.find().sort({ createdAt: -1 }).lean();

    return docs.map((doc) => ({
      id: String(doc._id),
      name: doc.name,
      category: doc.category,
      slug: doc.slug,
      isActive: doc.isActive,
      variantsCount: doc.variants.length,
      updatedAt: doc.updatedAt,
    }));
  } catch {
    return [];
  }
}

export async function listProductsForAdminPaged(filters: AdminProductListFilters = {}) {
  const page = Math.max(1, Number.isFinite(filters.page) ? Number(filters.page) : 1);
  const pageSize = Math.min(50, Math.max(1, Number.isFinite(filters.pageSize) ? Number(filters.pageSize) : 10));
  const q = (filters.q ?? "").trim();
  const status = filters.status ?? "all";

  try {
    await connectToDatabase();
    await seedProductsIfEmpty();

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

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(page, totalPages);

    return {
      products: docs.map((doc) => ({
        id: String(doc._id),
        name: doc.name,
        category: doc.category,
        slug: doc.slug,
        isActive: doc.isActive,
        variantsCount: doc.variants.length,
        updatedAt: doc.updatedAt,
      })),
      pagination: {
        page: safePage,
        pageSize,
        totalCount,
        totalPages,
      },
    };
  } catch {
    return {
      products: [],
      pagination: {
        page: 1,
        pageSize,
        totalCount: 0,
        totalPages: 1,
      },
    };
  }
}
