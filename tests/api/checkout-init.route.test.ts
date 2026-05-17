import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { initializePaystackTransaction } from "@/lib/paystack/client";
import { createPendingOrder } from "@/lib/services/order-service";

vi.mock("@/lib/auth/guards", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/services/order-service", () => ({
  createPendingOrder: vi.fn(),
}));

vi.mock("@/lib/paystack/client", () => ({
  initializePaystackTransaction: vi.fn(),
}));

import { POST } from "@/app/api/checkout/init/route";

const mockRequireAuthenticatedUser = vi.mocked(requireAuthenticatedUser);
const mockCreatePendingOrder = vi.mocked(createPendingOrder);
const mockInitializePaystackTransaction = vi.mocked(initializePaystackTransaction);

const validCheckoutPayload = {
  email: "buyer@example.com",
  fullName: "Test Buyer",
  phone: "+233536477207",
  address: "123 Oxford Street, Accra Ghana",
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

describe("POST /api/checkout/init", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes checkout and returns Paystack authorization url", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue(null);
    mockCreatePendingOrder.mockResolvedValue({
      id: "order_123",
      paymentReference: "PSK-ABC12345",
      amountTotal: 250,
      amountSubtotal: 240,
      shippingFee: 10,
      currency: "GHS",
      status: "Pending",
    });
    mockInitializePaystackTransaction.mockResolvedValue({
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://paystack.example/authorize/abc",
        access_code: "access_code_123",
        reference: "PSK-ABC12345",
      },
    });

    const request = new Request("http://localhost:3000/api/checkout/init", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validCheckoutPayload),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      orderId: "order_123",
      reference: "PSK-ABC12345",
      amount: 250,
      currency: "GHS",
      authorizationUrl: "https://paystack.example/authorize/abc",
    });
    expect(mockCreatePendingOrder).toHaveBeenCalledWith(validCheckoutPayload, null);
    expect(mockInitializePaystackTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "buyer@example.com",
        amountSubunit: 25000,
        reference: "PSK-ABC12345",
      }),
    );
  });

  it("returns 400 for invalid checkout payload", async () => {
    const request = new Request("http://localhost:3000/api/checkout/init", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "invalid" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      message: "Invalid checkout payload",
    });
    expect(mockCreatePendingOrder).not.toHaveBeenCalled();
    expect(mockInitializePaystackTransaction).not.toHaveBeenCalled();
  });

  it("returns 504 when Paystack initialization times out", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue(null);
    mockCreatePendingOrder.mockResolvedValue({
      id: "order_456",
      paymentReference: "PSK-TIMEOUT1",
      amountTotal: 95,
      amountSubtotal: 85,
      shippingFee: 10,
      currency: "GHS",
      status: "Pending",
    });
    mockInitializePaystackTransaction.mockRejectedValue(new Error("Paystack request timed out."));

    const request = new Request("http://localhost:3000/api/checkout/init", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validCheckoutPayload),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(504);
    expect(body).toMatchObject({
      ok: false,
      message: "Could not initialize payment in time. Please retry.",
    });
  });
});
