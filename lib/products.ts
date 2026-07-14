export type ProductVariant = {
  size: string;
  color: string;
  colorCode?: string;
  image?: string;
  sku: string;
  stock: number;
  stockOnHand?: number;
  soldQuantity?: number;
  orderCount?: number;
  priceOverride?: number;
};

export type Product = {
  slug: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  image: string;
  images?: string[];
  variants: ProductVariant[];
};

export const products: Product[] = [
  {
    slug: "cloud-tee",
    name: "Cloud Tee",
    category: "T-Shirts",
    description: "Soft premium cotton tee with relaxed silhouette.",
    basePrice: 28000,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    variants: [
      { size: "S", color: "Black", sku: "CT-BLK-S", stock: 7 },
      { size: "M", color: "Black", sku: "CT-BLK-M", stock: 12 },
      { size: "L", color: "Olive", sku: "CT-OLV-L", stock: 5, priceOverride: 30000 },
    ],
  },
  {
    slug: "field-jacket",
    name: "Field Jacket",
    category: "Outerwear",
    description: "Weather-ready jacket with clean military tailoring.",
    basePrice: 65000,
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80",
    variants: [
      { size: "M", color: "Khaki", sku: "FJ-KHA-M", stock: 3 },
      { size: "L", color: "Khaki", sku: "FJ-KHA-L", stock: 4 },
      { size: "XL", color: "Navy", sku: "FJ-NVY-XL", stock: 2, priceOverride: 69000 },
    ],
  },
  {
    slug: "core-chinos",
    name: "Core Chinos",
    category: "Bottoms",
    description: "Tailored chinos with stretch comfort.",
    basePrice: 40000,
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
    variants: [
      { size: "30", color: "Stone", sku: "CC-STN-30", stock: 6 },
      { size: "32", color: "Stone", sku: "CC-STN-32", stock: 10 },
      { size: "34", color: "Black", sku: "CC-BLK-34", stock: 4 },
    ],
  },
  {
    slug: "arc-hoodie",
    name: "Arc Hoodie",
    category: "Hoodies",
    description: "Heavyweight hoodie with structured drape.",
    basePrice: 48000,
    image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=900&q=80",
    variants: [
      { size: "S", color: "Cream", sku: "AH-CRM-S", stock: 8 },
      { size: "M", color: "Cream", sku: "AH-CRM-M", stock: 9 },
      { size: "L", color: "Black", sku: "AH-BLK-L", stock: 4 },
    ],
  },
  {
    slug: "linen-shirt",
    name: "Linen Shirt",
    category: "Shirts",
    description: "Breathable linen shirt with elevated finish.",
    basePrice: 35000,
    image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80",
    variants: [
      { size: "S", color: "White", sku: "LS-WHT-S", stock: 8 },
      { size: "M", color: "White", sku: "LS-WHT-M", stock: 9 },
      { size: "L", color: "Blue", sku: "LS-BLU-L", stock: 5 },
    ],
  },
  {
    slug: "studio-shorts",
    name: "Studio Shorts",
    category: "Bottoms",
    description: "Athleisure shorts built for movement.",
    basePrice: 24000,
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80",
    variants: [
      { size: "S", color: "Grey", sku: "SS-GRY-S", stock: 10 },
      { size: "M", color: "Grey", sku: "SS-GRY-M", stock: 11 },
      { size: "L", color: "Black", sku: "SS-BLK-L", stock: 8 },
    ],
  },
];

export type CartItem = {
  slug: string;
  name: string;
  image: string;
  size: string;
  color: string;
  sku: string;
  quantity: number;
  unitPrice: number;
};

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug) ?? null;
}

export function formatPriceNgn(value: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getVariantPrice(product: Product, sku: string) {
  const variant = product.variants.find((entry) => entry.sku === sku);
  if (!variant) {
    return product.basePrice;
  }

  return variant.priceOverride ?? product.basePrice;
}

export function calculateShipping(subtotal: number) {
  void subtotal;
  return 0;
}

export function calculateTransactionFee(subtotal: number) {
  return subtotal > 0 ? 4 : 0;
}

export type CartTotals = {
  subtotal: number;
  discount: number;
  discountedSubtotal: number;
  shipping: number;
  transactionFee: number;
  total: number;
};

export function calculateCartTotals(items: CartItem[], discountAmount = 0): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const safeDiscount = Math.max(0, Math.min(discountAmount, subtotal));
  const discountedSubtotal = subtotal - safeDiscount;
  const shipping = calculateShipping(discountedSubtotal);
  const transactionFee = calculateTransactionFee(discountedSubtotal);
  const total = discountedSubtotal + shipping + transactionFee;

  return {
    subtotal,
    discount: safeDiscount,
    discountedSubtotal,
    shipping,
    transactionFee,
    total,
  };
}

export function listCategories() {
  return Array.from(new Set(products.map((product) => product.category)));
}
