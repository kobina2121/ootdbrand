import { beforeEach, describe, expect, it, vi } from "vitest";

const mockConnectToDatabase = vi.fn();
const mockProductLean = vi.fn();
const mockProductFind = vi.fn(() => ({ lean: mockProductLean }));
const mockOrderAggregate = vi.fn();
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

describe("resolveOrderItemsFromCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProductLean.mockResolvedValue([productDoc]);
    mockOrderAggregate.mockResolvedValue([]);
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
