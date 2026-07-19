import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { initializePaystackTransaction } from "@/lib/paystack/client";
import { createPendingOrder, failPendingOrderByReference } from "@/lib/services/order-service";

vi.mock("@/lib/auth/guards", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/services/order-service", () => ({
  createPendingOrder: vi.fn(),
  failPendingOrderByReference: vi.fn(),
}));

vi.mock("@/lib/paystack/client", () => ({
  initializePaystackTransaction: vi.fn(),
}));

import { POST } from "@/app/api/checkout/init/route";

const mockRequireAuthenticatedUser = vi.mocked(requireAuthenticatedUser);
const mockCreatePendingOrder = vi.mocked(createPendingOrder);
const mockFailPendingOrderByReference = vi.mocked(failPendingOrderByReference);
const mockInitializePaystackTransaction = vi.mocked(initializePaystackTransaction);

const validCheckoutPayload = {
  email: "buyer@example.com",
  fullName: "Test Buyer",
  phone: "+233536477207",
  address: "123 Oxford Street, Accra Ghana",
  discountCode: "OOTD10",
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
const customerSession = {
  user: {
    id: "64f1f0000000000000000001",
    name: "Test Buyer",
    email: "buyer@example.com",
    role: "customer" as const,
  },
  expires: new Date(Date.now() + 60_000).toISOString(),
};

describe("POST /api/checkout/init", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue(customerSession);
    mockFailPendingOrderByReference.mockResolvedValue(null);
  });

  it("initializes checkout and returns Paystack authorization url", async () => {
    mockCreatePendingOrder.mockResolvedValue({
      id: "order_123",
      paymentReference: "PSK-ABC12345",
      amountTotal: 250,
      amountSubtotal: 240,
      discountCode: "OOTD10",
      discountAmount: 20,
      shippingFee: 0,
      transactionFee: 4,
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
    expect(mockCreatePendingOrder).toHaveBeenCalledWith(
      validCheckoutPayload,
      {
        id: "64f1f0000000000000000001",
        name: "Test Buyer",
        email: "buyer@example.com",
        role: "customer",
      },
    );
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

  it("returns 401 when a guest tries to checkout", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue(null);

    const request = new Request("http://localhost:3000/api/checkout/init", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validCheckoutPayload),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      ok: false,
      message: "Please sign in before checkout.",
    });
    expect(mockCreatePendingOrder).not.toHaveBeenCalled();
    expect(mockInitializePaystackTransaction).not.toHaveBeenCalled();
  });

  it("returns 403 when an admin account tries to checkout", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      user: {
        id: "admin_1",
        name: "Store Admin",
        email: "admin@theootd.brand",
        role: "admin",
      },
      expires: new Date(Date.now() + 60_000).toISOString(),
    });

    const request = new Request("http://localhost:3000/api/checkout/init", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validCheckoutPayload),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      ok: false,
      message: "Admin accounts cannot place store orders.",
    });
    expect(mockCreatePendingOrder).not.toHaveBeenCalled();
    expect(mockInitializePaystackTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 when the coupon code is invalid", async () => {
    mockCreatePendingOrder.mockRejectedValue(new Error("Coupon code is invalid or inactive."));

    const request = new Request("http://localhost:3000/api/checkout/init", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validCheckoutPayload),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      message: "Coupon code is invalid or inactive.",
    });
    expect(mockInitializePaystackTransaction).not.toHaveBeenCalled();
  });

  it("returns 504 when Paystack initialization times out", async () => {
    mockCreatePendingOrder.mockResolvedValue({
      id: "order_456",
      paymentReference: "PSK-TIMEOUT1",
      amountTotal: 95,
      amountSubtotal: 85,
      discountCode: "OOTD10",
      discountAmount: 0,
      shippingFee: 0,
      transactionFee: 4,
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
    expect(mockFailPendingOrderByReference).toHaveBeenCalledWith("PSK-TIMEOUT1", "Paystack request timed out.");
  });

  it("marks pending order failed when Paystack initialization returns status=false", async () => {
    mockCreatePendingOrder.mockResolvedValue({
      id: "order_987",
      paymentReference: "PSK-FAILED00",
      amountTotal: 120,
      amountSubtotal: 110,
      discountCode: "OOTD10",
      discountAmount: 0,
      shippingFee: 0,
      transactionFee: 4,
      currency: "GHS",
      status: "Pending",
    });
    mockInitializePaystackTransaction.mockResolvedValue({
      status: false,
      message: "Gateway rejected request",
      data: {
        authorization_url: "",
        access_code: "",
        reference: "PSK-FAILED00",
      },
    });

    const request = new Request("http://localhost:3000/api/checkout/init", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validCheckoutPayload),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toMatchObject({
      ok: false,
      message: "Gateway rejected request",
    });
    expect(mockFailPendingOrderByReference).toHaveBeenCalledWith("PSK-FAILED00", "Gateway rejected request");
  });
});
