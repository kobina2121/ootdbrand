import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentSession } from "@/lib/auth/guards";
import { resolveOrderItemsFromCart } from "@/lib/services/product-service";

vi.mock("@/lib/auth/guards", () => ({
  getCurrentSession: vi.fn(),
}));

vi.mock("@/lib/services/product-service", () => ({
  resolveOrderItemsFromCart: vi.fn(),
}));

import { POST } from "@/app/api/cart/route";

const mockGetCurrentSession = vi.mocked(getCurrentSession);
const mockResolveOrderItemsFromCart = vi.mocked(resolveOrderItemsFromCart);

const validCartPayload = {
  items: [
    {
      slug: "arc-hoodie",
      name: "Arc Hoodie",
      image: "/images/arc-hoodie.jpg",
      size: "M",
      color: "Black",
      sku: "ARC-HOODIE-BLK-M",
      quantity: 2,
      unitPrice: 120,
    },
  ],
};

describe("POST /api/cart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.STORE_DISCOUNT_CODES;
    mockGetCurrentSession.mockResolvedValue(null);
    mockResolveOrderItemsFromCart.mockResolvedValue([
      {
        productId: "product_1",
        productNameSnapshot: "Arc Hoodie",
        variant: {
          size: "M",
          color: { name: "Black", code: "#000000" },
          sku: "ARC-HOODIE-BLK-M",
        },
        quantity: 2,
        unitPrice: 120,
      },
    ]);
  });

  it("returns synced totals with an applied coupon", async () => {
    process.env.STORE_DISCOUNT_CODES = JSON.stringify([
      { code: "TIDE10", type: "percentage", value: 10 },
    ]);

    const request = new Request("http://localhost:3000/api/cart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validCartPayload, discountCode: "TIDE10" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      itemsCount: 1,
      totals: {
        subtotal: 240,
        discount: 24,
        discountedSubtotal: 216,
        shipping: 0,
        transactionFee: 4,
        total: 220,
      },
      discount: {
        requestedCode: "TIDE10",
        appliedCode: "TIDE10",
        amount: 24,
        message: null,
      },
    });
  });

  it("keeps the cart valid while marking an invalid coupon", async () => {
    process.env.STORE_DISCOUNT_CODES = JSON.stringify([
      { code: "TIDE10", type: "percentage", value: 10 },
    ]);

    const request = new Request("http://localhost:3000/api/cart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validCartPayload, discountCode: "NOPE" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      totals: {
        subtotal: 240,
        discount: 0,
        discountedSubtotal: 240,
        shipping: 0,
        transactionFee: 4,
        total: 244,
      },
      discount: {
        requestedCode: "NOPE",
        appliedCode: null,
        amount: 0,
        message: "Coupon code is invalid or inactive.",
      },
    });
  });
});
