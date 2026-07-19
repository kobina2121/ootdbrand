import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { verifyPaystackTransaction } from "@/lib/paystack/client";
import {
  isCustomOrderReferenceOwnedByUser,
  reconcileCustomOrderAfterVerification,
} from "@/lib/services/custom-order-service";
import { isOrderReferenceOwnedByUser, reconcileOrderAfterVerification } from "@/lib/services/order-service";
import { recordPaymentEvent } from "@/lib/services/payment-event-service";

vi.mock("@/lib/auth/guards", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/paystack/client", () => ({
  verifyPaystackTransaction: vi.fn(),
}));

vi.mock("@/lib/services/order-service", () => ({
  isOrderReferenceOwnedByUser: vi.fn(),
  reconcileOrderAfterVerification: vi.fn(),
}));

vi.mock("@/lib/services/custom-order-service", () => ({
  isCustomOrderReferenceOwnedByUser: vi.fn(),
  reconcileCustomOrderAfterVerification: vi.fn(),
}));

vi.mock("@/lib/services/payment-event-service", () => ({
  recordPaymentEvent: vi.fn(),
}));

import { POST } from "@/app/api/paystack/verify/route";

const mockRequireAuthenticatedUser = vi.mocked(requireAuthenticatedUser);
const mockVerifyPaystackTransaction = vi.mocked(verifyPaystackTransaction);
const mockIsOrderReferenceOwnedByUser = vi.mocked(isOrderReferenceOwnedByUser);
const mockReconcileOrderAfterVerification = vi.mocked(reconcileOrderAfterVerification);
const mockIsCustomOrderReferenceOwnedByUser = vi.mocked(isCustomOrderReferenceOwnedByUser);
const mockReconcileCustomOrderAfterVerification = vi.mocked(reconcileCustomOrderAfterVerification);
const mockRecordPaymentEvent = vi.mocked(recordPaymentEvent);
const customerSession = {
  user: {
    id: "64f1f0000000000000000003",
    name: "Order Owner",
    email: "owner@example.com",
    role: "customer" as const,
  },
  expires: new Date(Date.now() + 60_000).toISOString(),
};

function buildRequest(reference: string) {
  return new Request("http://localhost:3000/api/paystack/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reference }),
  });
}

describe("POST /api/paystack/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue(customerSession);
    mockIsOrderReferenceOwnedByUser.mockResolvedValue(true);
    mockIsCustomOrderReferenceOwnedByUser.mockResolvedValue(false);
    mockReconcileCustomOrderAfterVerification.mockResolvedValue(null);
  });

  it("verifies and returns store order result when reference matches a store order", async () => {
    mockVerifyPaystackTransaction.mockResolvedValue({
      status: true,
      message: "Verification successful",
      data: {
        status: "success",
        reference: "PSK-STORE-001",
        amount: 45000,
        currency: "GHS",
        paid_at: "2026-05-17T01:30:00.000Z",
        gateway_response: "Successful",
      },
    });
    mockReconcileOrderAfterVerification.mockResolvedValue({
      orderId: "order_001",
      status: "Success",
      changed: true,
      reason: "verified-success",
    });

    const response = await POST(buildRequest("PSK-STORE-001"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      data: {
        reference: "PSK-STORE-001",
        orderStatus: "Success",
        reason: "verified-success",
        orderType: "store",
      },
    });
    expect(mockReconcileCustomOrderAfterVerification).not.toHaveBeenCalled();
  });

  it("falls back to custom order reconciliation when store order is not found", async () => {
    mockIsOrderReferenceOwnedByUser.mockResolvedValue(false);
    mockIsCustomOrderReferenceOwnedByUser.mockResolvedValue(true);
    mockVerifyPaystackTransaction.mockResolvedValue({
      status: true,
      message: "Verification successful",
      data: {
        status: "success",
        reference: "CUS-ORDER-001",
        amount: 15000,
        currency: "GHS",
        paid_at: "2026-05-17T01:35:00.000Z",
        gateway_response: "Successful",
      },
    });
    mockReconcileOrderAfterVerification.mockResolvedValue(null);
    mockReconcileCustomOrderAfterVerification.mockResolvedValue({
      customOrderId: "custom_001",
      status: "Success",
      changed: true,
      reason: "verified-success",
    });

    const response = await POST(buildRequest("CUS-ORDER-001"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      data: {
        reference: "CUS-ORDER-001",
        orderStatus: "Success",
        reason: "verified-success",
        orderType: "custom",
      },
    });
  });

  it("returns 404 when no store or custom order is found for reference", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      user: {
        id: "admin_1",
        name: "Admin",
        email: "admin@theootd.brand",
        role: "admin",
      },
      expires: new Date(Date.now() + 60_000).toISOString(),
    });
    mockVerifyPaystackTransaction.mockResolvedValue({
      status: true,
      message: "Verification successful",
      data: {
        status: "success",
        reference: "REF-NOT-FOUND",
        amount: 10000,
        currency: "GHS",
        paid_at: null,
      },
    });
    mockReconcileOrderAfterVerification.mockResolvedValue(null);
    mockReconcileCustomOrderAfterVerification.mockResolvedValue(null);

    const response = await POST(buildRequest("REF-NOT-FOUND"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      ok: false,
      message: "Order not found for this payment reference",
    });
    expect(mockRecordPaymentEvent).toHaveBeenCalled();
  });

  it("returns 401 when a guest tries to verify a payment", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue(null);

    const response = await POST(buildRequest("PSK-STORE-001"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      ok: false,
      message: "Please sign in before verifying payment.",
    });
    expect(mockVerifyPaystackTransaction).not.toHaveBeenCalled();
  });

  it("returns 404 when a customer tries to verify another user's reference", async () => {
    mockIsOrderReferenceOwnedByUser.mockResolvedValue(false);
    mockIsCustomOrderReferenceOwnedByUser.mockResolvedValue(false);

    const response = await POST(buildRequest("PSK-OTHER-001"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      ok: false,
      message: "Order not found for this payment reference",
    });
    expect(mockVerifyPaystackTransaction).not.toHaveBeenCalled();
  });
});
