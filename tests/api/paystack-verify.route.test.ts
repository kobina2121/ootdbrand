import { beforeEach, describe, expect, it, vi } from "vitest";

import { verifyPaystackTransaction } from "@/lib/paystack/client";
import { reconcileCustomOrderAfterVerification } from "@/lib/services/custom-order-service";
import { reconcileOrderAfterVerification } from "@/lib/services/order-service";
import { recordPaymentEvent } from "@/lib/services/payment-event-service";

vi.mock("@/lib/paystack/client", () => ({
  verifyPaystackTransaction: vi.fn(),
}));

vi.mock("@/lib/services/order-service", () => ({
  reconcileOrderAfterVerification: vi.fn(),
}));

vi.mock("@/lib/services/custom-order-service", () => ({
  reconcileCustomOrderAfterVerification: vi.fn(),
}));

vi.mock("@/lib/services/payment-event-service", () => ({
  recordPaymentEvent: vi.fn(),
}));

import { POST } from "@/app/api/paystack/verify/route";

const mockVerifyPaystackTransaction = vi.mocked(verifyPaystackTransaction);
const mockReconcileOrderAfterVerification = vi.mocked(reconcileOrderAfterVerification);
const mockReconcileCustomOrderAfterVerification = vi.mocked(reconcileCustomOrderAfterVerification);
const mockRecordPaymentEvent = vi.mocked(recordPaymentEvent);

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
});
