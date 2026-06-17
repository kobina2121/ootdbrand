import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { initializePaystackTransaction } from "@/lib/paystack/client";
import {
  createPendingCustomOrder,
  failPendingCustomOrderByReference,
} from "@/lib/services/custom-order-service";

vi.mock("@/lib/auth/guards", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/services/custom-order-service", () => ({
  createPendingCustomOrder: vi.fn(),
  failPendingCustomOrderByReference: vi.fn(),
}));

vi.mock("@/lib/paystack/client", () => ({
  initializePaystackTransaction: vi.fn(),
}));

import { POST } from "@/app/api/custom-order/init/route";

const mockRequireAuthenticatedUser = vi.mocked(requireAuthenticatedUser);
const mockCreatePendingCustomOrder = vi.mocked(createPendingCustomOrder);
const mockFailPendingCustomOrderByReference = vi.mocked(failPendingCustomOrderByReference);
const mockInitializePaystackTransaction = vi.mocked(initializePaystackTransaction);

const validPayload = {
  productSlug: "arc-hoodie",
  fullName: "Custom Buyer",
  email: "custom@example.com",
  phone: "+233536477207",
  type: "Dress",
  preferredSize: "M / Tall Fit",
  preferredColor: "Deep Wine",
  bustSize: "34in",
  waistSize: "28in",
  hipSize: "40in",
  additionalMeasurements: "Length 62in",
  notes: "Sleeveless neckline.",
  referenceImage: "/uploads/custom-orders/sample.jpg",
  referenceImages: [
    "/uploads/custom-orders/sample.jpg",
    "/uploads/custom-orders/sample-2.jpg",
  ],
  deliveryAddress: {
    addressLine: "12 Liberation Road",
    city: "Accra",
    stateRegion: "Greater Accra",
    country: "Ghana",
  },
};

describe("POST /api/custom-order/init", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue(null);
    mockFailPendingCustomOrderByReference.mockResolvedValue(null);
  });

  it("initializes custom-order payment and returns authorization url", async () => {
    mockCreatePendingCustomOrder.mockResolvedValue({
      id: "custom_order_001",
      paymentReference: "CUS-ABCD1234",
      amountTotal: 150,
      baseUnitPrice: 150,
      customizationCharge: 0,
      currency: "GHS",
      status: "Pending",
    });
    mockInitializePaystackTransaction.mockResolvedValue({
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://paystack.example/authorize/custom",
        access_code: "access_code_custom",
        reference: "CUS-ABCD1234",
      },
    });

    const request = new Request("http://localhost:3000/api/custom-order/init", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      customOrderId: "custom_order_001",
      reference: "CUS-ABCD1234",
      amount: 150,
      currency: "GHS",
      authorizationUrl: "https://paystack.example/authorize/custom",
    });
    expect(mockCreatePendingCustomOrder).toHaveBeenCalledWith(validPayload, null);
  });

  it("returns 400 for invalid payload", async () => {
    const request = new Request("http://localhost:3000/api/custom-order/init", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "bad@email" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      message: "Invalid custom order payload",
    });
  });

  it("returns 403 when an admin account tries to place a custom order", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      user: {
        id: "admin_1",
        name: "Store Admin",
        email: "admin@tide.brand",
        role: "admin",
      },
      expires: new Date(Date.now() + 60_000).toISOString(),
    });

    const request = new Request("http://localhost:3000/api/custom-order/init", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      ok: false,
      message: "Admin accounts cannot place custom orders.",
    });
    expect(mockCreatePendingCustomOrder).not.toHaveBeenCalled();
    expect(mockInitializePaystackTransaction).not.toHaveBeenCalled();
  });

  it("marks pending custom order failed when paystack init returns status=false", async () => {
    mockCreatePendingCustomOrder.mockResolvedValue({
      id: "custom_order_002",
      paymentReference: "CUS-FAIL1234",
      amountTotal: 150,
      baseUnitPrice: 150,
      customizationCharge: 0,
      currency: "GHS",
      status: "Pending",
    });
    mockInitializePaystackTransaction.mockResolvedValue({
      status: false,
      message: "Gateway rejected request",
      data: {
        authorization_url: "",
        access_code: "",
        reference: "CUS-FAIL1234",
      },
    });

    const request = new Request("http://localhost:3000/api/custom-order/init", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toMatchObject({
      ok: false,
      message: "Gateway rejected request",
    });
    expect(mockFailPendingCustomOrderByReference).toHaveBeenCalledWith("CUS-FAIL1234", "Gateway rejected request");
  });
});
