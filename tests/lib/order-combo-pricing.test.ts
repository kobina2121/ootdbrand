import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockOrderCreate, mockResolveItems } = vi.hoisted(() => ({
  mockOrderCreate: vi.fn(),
  mockResolveItems: vi.fn(),
}));

vi.mock("@/lib/db/mongoose", () => ({ connectToDatabase: vi.fn() }));
vi.mock("@/lib/db/models/order", () => ({ OrderModel: { create: mockOrderCreate } }));
vi.mock("@/lib/services/product-service", () => ({ resolveOrderItemsFromCart: mockResolveItems }));

import { createPendingOrder } from "@/lib/services/order-service";

const resolvedItem = (category: string, sku: string, unitPrice: number) => ({
  productId: sku,
  productNameSnapshot: sku,
  category,
  variant: { size: "M", color: { name: "Wine", code: "#7A1730" }, sku },
  quantity: 1,
  unitPrice,
});

const input = {
  fullName: "Test Customer",
  email: "customer@example.com",
  phone: "0200000000",
  address: "1 Test Street",
  items: [],
};

describe("createPendingOrder combo pricing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.STORE_DISCOUNT_CODES;
    mockOrderCreate.mockResolvedValue({ _id: "order_1", currency: "GHS", status: "Pending", createdAt: new Date() });
  });

  it("charges the combo price for a top and skirt", async () => {
    mockResolveItems.mockResolvedValue([resolvedItem("TOPS", "TOP-M", 200), resolvedItem("SKIRTS", "SKIRT-M", 150)]);

    const order = await createPendingOrder(input);

    expect(order).toMatchObject({ amountSubtotal: 350, discountAmount: 10, discountCode: "COMBO", amountTotal: 344 });
    expect(mockOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({ discountAmount: 10, discountCode: "COMBO", amountTotal: 344 }),
    );
  });

  it("charges full price without a complete pair", async () => {
    mockResolveItems.mockResolvedValue([resolvedItem("TOPS", "TOP-M", 200)]);

    const order = await createPendingOrder(input);

    expect(order).toMatchObject({ discountAmount: 0, discountCode: null, amountTotal: 204 });
  });

  it("accepts a valid coupon that loses to the combo saving", async () => {
    process.env.STORE_DISCOUNT_CODES = JSON.stringify([{ code: "OOTD", type: "fixed", value: 5 }]);
    mockResolveItems.mockResolvedValue([resolvedItem("TOPS", "TOP-M", 200), resolvedItem("SKIRTS", "SKIRT-M", 150)]);

    const order = await createPendingOrder({ ...input, discountCode: "OOTD" });

    expect(order).toMatchObject({ discountAmount: 10, discountCode: "COMBO" });
  });

  it("still rejects an invalid coupon", async () => {
    mockResolveItems.mockResolvedValue([resolvedItem("TOPS", "TOP-M", 200), resolvedItem("SKIRTS", "SKIRT-M", 150)]);

    await expect(createPendingOrder({ ...input, discountCode: "NOPE" })).rejects.toThrow("Coupon code is invalid");
    expect(mockOrderCreate).not.toHaveBeenCalled();
  });
});
