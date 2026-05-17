import { beforeEach, describe, expect, it, vi } from "vitest";

import { verifyPaystackTransaction, verifyPaystackWebhookSignature } from "@/lib/paystack/client";
import { reconcileCustomOrderAfterVerification } from "@/lib/services/custom-order-service";
import { reconcileOrderAfterVerification } from "@/lib/services/order-service";
import { buildPaymentEventKey, hasPaymentEvent, recordPaymentEvent } from "@/lib/services/payment-event-service";

vi.mock("@/lib/paystack/client", () => ({
  verifyPaystackTransaction: vi.fn(),
  verifyPaystackWebhookSignature: vi.fn(),
}));

vi.mock("@/lib/services/order-service", () => ({
  reconcileOrderAfterVerification: vi.fn(),
}));

vi.mock("@/lib/services/custom-order-service", () => ({
  reconcileCustomOrderAfterVerification: vi.fn(),
}));

vi.mock("@/lib/services/payment-event-service", () => ({
  buildPaymentEventKey: vi.fn(),
  hasPaymentEvent: vi.fn(),
  recordPaymentEvent: vi.fn(),
}));

import { POST } from "@/app/api/webhooks/paystack/route";

const mockVerifyPaystackTransaction = vi.mocked(verifyPaystackTransaction);
const mockVerifyPaystackWebhookSignature = vi.mocked(verifyPaystackWebhookSignature);
const mockReconcileCustomOrderAfterVerification = vi.mocked(reconcileCustomOrderAfterVerification);
const mockReconcileOrderAfterVerification = vi.mocked(reconcileOrderAfterVerification);
const mockBuildPaymentEventKey = vi.mocked(buildPaymentEventKey);
const mockHasPaymentEvent = vi.mocked(hasPaymentEvent);
const mockRecordPaymentEvent = vi.mocked(recordPaymentEvent);

function buildRequest(payload: unknown, signature = "sig") {
  return new Request("http://localhost:3000/api/webhooks/paystack", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-paystack-signature": signature,
    },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/webhooks/paystack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuildPaymentEventKey.mockImplementation((reference: string, eventType: string) => `${reference}:${eventType}`);
    mockReconcileCustomOrderAfterVerification.mockResolvedValue(null);
  });

  it("returns acknowledged response for invalid webhook signature", async () => {
    mockVerifyPaystackWebhookSignature.mockReturnValue(false);

    const response = await POST(buildRequest({ event: "charge.success", data: { reference: "PSK-INV" } }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, received: false, invalidSignature: true });
    expect(mockVerifyPaystackTransaction).not.toHaveBeenCalled();
  });

  it("returns duplicate=true when event key has already been processed", async () => {
    mockVerifyPaystackWebhookSignature.mockReturnValue(true);
    mockHasPaymentEvent.mockResolvedValue(true);

    const response = await POST(buildRequest({ event: "charge.success", data: { reference: "PSK-DUPE" } }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, received: true, duplicate: true });
    expect(mockVerifyPaystackTransaction).not.toHaveBeenCalled();
  });

  it("reconciles and records success for a valid verified payment", async () => {
    mockVerifyPaystackWebhookSignature.mockReturnValue(true);
    mockHasPaymentEvent.mockResolvedValue(false);
    mockVerifyPaystackTransaction.mockResolvedValue({
      status: true,
      message: "Verification successful",
      data: {
        status: "success",
        reference: "PSK-SUCCESS",
        amount: 45000,
        currency: "GHS",
        paid_at: "2026-05-16T18:00:00.000Z",
        gateway_response: "Successful",
      },
    });
    mockReconcileOrderAfterVerification.mockResolvedValue({
      orderId: "order_789",
      status: "Success",
      changed: true,
      reason: "verified-success",
    });

    const response = await POST(buildRequest({ event: "charge.success", data: { reference: "PSK-SUCCESS" } }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, received: true });
    expect(mockReconcileOrderAfterVerification).toHaveBeenCalledWith("PSK-SUCCESS", {
      status: "success",
      amountSubunit: 45000,
      currency: "GHS",
      paidAt: "2026-05-16T18:00:00.000Z",
      gatewayResponse: "Successful",
    });
    expect(mockRecordPaymentEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: "PSK-SUCCESS",
        eventType: "webhook.charge.success",
        verified: true,
      }),
    );
  });

  it("marks event as mismatch when verification returns a different reference", async () => {
    mockVerifyPaystackWebhookSignature.mockReturnValue(true);
    mockHasPaymentEvent.mockResolvedValue(false);
    mockVerifyPaystackTransaction.mockResolvedValue({
      status: true,
      message: "Verification successful",
      data: {
        status: "success",
        reference: "PSK-OTHER",
        amount: 45000,
        currency: "GHS",
        paid_at: null,
      },
    });

    const response = await POST(buildRequest({ event: "charge.success", data: { reference: "PSK-EXPECTED" } }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, received: true, referenceMismatch: true });
    expect(mockReconcileOrderAfterVerification).not.toHaveBeenCalled();
    expect(mockRecordPaymentEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: "PSK-EXPECTED",
        verified: false,
      }),
    );
  });

  it("returns queued=false and records audit event when verification throws", async () => {
    mockVerifyPaystackWebhookSignature.mockReturnValue(true);
    mockHasPaymentEvent.mockResolvedValue(false);
    mockVerifyPaystackTransaction.mockRejectedValue(new Error("gateway unavailable"));

    const response = await POST(buildRequest({ event: "charge.success", data: { reference: "PSK-ERR" } }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, received: true, queued: false });
    expect(mockRecordPaymentEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: "PSK-ERR",
        eventType: "webhook.charge.success",
        verified: false,
      }),
    );
  });

  it("reconciles custom order when store order reference is not found", async () => {
    mockVerifyPaystackWebhookSignature.mockReturnValue(true);
    mockHasPaymentEvent.mockResolvedValue(false);
    mockVerifyPaystackTransaction.mockResolvedValue({
      status: true,
      message: "Verification successful",
      data: {
        status: "success",
        reference: "CUS-REF-001",
        amount: 15000,
        currency: "GHS",
        paid_at: "2026-05-17T01:00:00.000Z",
        gateway_response: "Successful",
      },
    });
    mockReconcileOrderAfterVerification.mockResolvedValue(null);
    mockReconcileCustomOrderAfterVerification.mockResolvedValue({
      customOrderId: "custom_order_1",
      status: "Success",
      changed: true,
      reason: "verified-success",
    });

    const response = await POST(buildRequest({ event: "charge.success", data: { reference: "CUS-REF-001" } }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, received: true });
    expect(mockReconcileOrderAfterVerification).toHaveBeenCalled();
    expect(mockReconcileCustomOrderAfterVerification).toHaveBeenCalledWith("CUS-REF-001", {
      status: "success",
      amountSubunit: 15000,
      currency: "GHS",
      paidAt: "2026-05-17T01:00:00.000Z",
      gatewayResponse: "Successful",
    });
    expect(mockRecordPaymentEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: "CUS-REF-001",
        payload: expect.objectContaining({
          reconcileTarget: "custom",
        }),
      }),
    );
  });
});
