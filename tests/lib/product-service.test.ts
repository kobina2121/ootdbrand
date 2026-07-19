import { beforeEach, describe, expect, it, vi } from "vitest";

const mockConnectToDatabase = vi.fn();
const mockProductLean = vi.fn();
const mockProductFind = vi.fn(() => ({ lean: mockProductLean }));
const mockOrderAggregate = vi.fn();
const mockProductReviewAggregate = vi.fn();
const mockNoStore = vi.fn();

vi.mock("next/cache", () => ({
  unstable_noStore: mockNoStore,
}));

vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: mockConnectToDatabase,
}));

vi.mock("@/lib/db/models/product", () => ({
  ProductModel: {
    find: mockProductFind,
  },
}));

vi.mock("@/lib/db/models/order", () => ({
  OrderModel: {
    aggregate: mockOrderAggregate,
  },
}));

vi.mock("@/lib/db/models/product-review", () => ({
  ProductReviewModel: {
    aggregate: mockProductReviewAggregate,
  },
}));

const productDoc = {
  _id: "product-1",
  name: "Test Dress",
  basePrice: 350,
  variants: [
    {
      size: "M",
      color: { name: "Wine", code: "#7A1730" },
      sku: "TEST-DRESS-WINE-M",
      stock: 8,
      priceOverride: undefined,
    },
  ],
};

const storefrontProductDoc = {
  ...productDoc,
  slug: "test-dress",
  category: "MAXI",
  description: "A beautiful test dress.",
  images: ["/images/test-dress.jpg"],
};

describe("resolveOrderItemsFromCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProductLean.mockResolvedValue([productDoc]);
    mockOrderAggregate.mockResolvedValue([]);
    mockProductReviewAggregate.mockResolvedValue([]);
  });

  it("allows checkout when requested quantity fits stock after successful orders", async () => {
    mockOrderAggregate.mockResolvedValue([{ _id: "TEST-DRESS-WINE-M", soldQuantity: 3, orderCount: 2 }]);
    const { resolveOrderItemsFromCart } = await import("@/lib/services/product-service");

    await expect(
      resolveOrderItemsFromCart([
        {
          slug: "test-dress",
          name: "Test Dress",
          image: "/images/test.jpg",
          size: "M",
          color: "Wine",
          sku: "TEST-DRESS-WINE-M",
          quantity: 5,
          unitPrice: 350,
        },
      ]),
    ).resolves.toMatchObject([
      {
        productId: "product-1",
        productNameSnapshot: "Test Dress",
        quantity: 5,
        unitPrice: 350,
        variant: {
          sku: "TEST-DRESS-WINE-M",
          size: "M",
          color: { name: "Wine", code: "#7A1730" },
        },
      },
    ]);
    expect(mockOrderAggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        { $match: { status: "Success", "items.variant.sku": { $in: ["TEST-DRESS-WINE-M"] } } },
      ]),
    );
  });

  it("does not reduce checkout stock for pending unpaid orders", async () => {
    mockOrderAggregate.mockResolvedValue([]);
    const { resolveOrderItemsFromCart } = await import("@/lib/services/product-service");

    await expect(
      resolveOrderItemsFromCart([
        {
          slug: "test-dress",
          name: "Test Dress",
          image: "/images/test.jpg",
          size: "M",
          color: "Wine",
          sku: "TEST-DRESS-WINE-M",
          quantity: 8,
          unitPrice: 350,
        },
      ]),
    ).resolves.toHaveLength(1);

    expect(mockOrderAggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        { $match: { status: "Success", "items.variant.sku": { $in: ["TEST-DRESS-WINE-M"] } } },
      ]),
    );
  });

  it("rejects checkout when successful orders have consumed available stock", async () => {
    mockOrderAggregate.mockResolvedValue([{ _id: "TEST-DRESS-WINE-M", soldQuantity: 3, orderCount: 2 }]);
    const { resolveOrderItemsFromCart } = await import("@/lib/services/product-service");

    await expect(
      resolveOrderItemsFromCart([
        {
          slug: "test-dress",
          name: "Test Dress",
          image: "/images/test.jpg",
          size: "M",
          color: "Wine",
          sku: "TEST-DRESS-WINE-M",
          quantity: 6,
          unitPrice: 350,
        },
      ]),
    ).rejects.toThrow("Insufficient stock for TEST-DRESS-WINE-M");
  });

  it("rejects only the selected out-of-stock variant when another variant has stock", async () => {
    mockProductLean.mockResolvedValue([
      {
        ...productDoc,
        variants: [
          {
            size: "M",
            color: { name: "Wine", code: "#7A1730" },
            sku: "TEST-DRESS-WINE-M",
            stock: 8,
            priceOverride: undefined,
          },
          {
            size: "L",
            color: { name: "Wine", code: "#7A1730" },
            sku: "TEST-DRESS-WINE-L",
            stock: 0,
            priceOverride: undefined,
          },
        ],
      },
    ]);
    const { resolveOrderItemsFromCart } = await import("@/lib/services/product-service");

    await expect(
      resolveOrderItemsFromCart([
        {
          slug: "test-dress",
          name: "Test Dress",
          image: "/images/test.jpg",
          size: "L",
          color: "Wine",
          sku: "TEST-DRESS-WINE-L",
          quantity: 1,
          unitPrice: 350,
        },
      ]),
    ).rejects.toThrow("Insufficient stock for TEST-DRESS-WINE-L");
  });
});

describe("listProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProductLean.mockResolvedValue([storefrontProductDoc]);
    mockOrderAggregate.mockResolvedValue([]);
    mockProductReviewAggregate.mockResolvedValue([{ _id: "test-dress", rating: 4.5, reviewCount: 2 }]);
  });

  it("includes approved review summary data for storefront cards", async () => {
    const { listProducts } = await import("@/lib/services/product-service");

    await expect(listProducts({ activeOnly: true })).resolves.toMatchObject([
      {
        slug: "test-dress",
        rating: 4.5,
        reviewCount: 2,
      },
    ]);

    expect(mockProductReviewAggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        { $match: { isApproved: true, productSlug: { $in: ["test-dress"] } } },
        expect.objectContaining({
          $group: expect.objectContaining({
            _id: "$productSlug",
            rating: { $avg: "$rating" },
            reviewCount: { $sum: 1 },
          }),
        }),
      ]),
    );
  });

  it("shows available stock without subtracting pending unpaid orders", async () => {
    const { listProducts } = await import("@/lib/services/product-service");

    await expect(listProducts({ activeOnly: true })).resolves.toMatchObject([
      {
        slug: "test-dress",
        variants: [
          {
            sku: "TEST-DRESS-WINE-M",
            stock: 8,
            stockOnHand: 8,
            soldQuantity: 0,
          },
        ],
      },
    ]);

    expect(mockOrderAggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        { $match: { status: "Success", "items.variant.sku": { $in: ["TEST-DRESS-WINE-M"] } } },
      ]),
    );
  });
});
