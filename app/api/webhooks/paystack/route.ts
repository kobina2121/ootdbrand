import { NextResponse } from "next/server";

import { verifyPaystackTransaction, verifyPaystackWebhookSignature } from "@/lib/paystack/client";
import { reconcileCustomOrderAfterVerification } from "@/lib/services/custom-order-service";
import { reconcileOrderAfterVerification } from "@/lib/services/order-service";
import { buildPaymentEventKey, hasPaymentEvent, recordPaymentEvent } from "@/lib/services/payment-event-service";

type PaystackWebhookBody = {
  event?: string;
  data?: {
    reference?: string;
  };
};

export async function POST(request: Request) {
  const signature = request.headers.get("x-paystack-signature");
  const rawBody = await request.text();

  const isValidSignature = verifyPaystackWebhookSignature(rawBody, signature);

  if (!isValidSignature) {
    console.warn("[paystack.webhook] Invalid signature");
    // Return 200 to avoid repeated retries for invalid requests.
    return NextResponse.json({ ok: true, received: false, invalidSignature: true });
  }

  let payload: PaystackWebhookBody;

  try {
    payload = JSON.parse(rawBody) as PaystackWebhookBody;
  } catch {
    return NextResponse.json({ ok: true, received: true });
  }

  const eventType = payload.event ?? "unknown";
  const auditEventType = `webhook.${eventType}`;
  const reference = payload.data?.reference;

  if (!reference) {
    return NextResponse.json({ ok: true, received: true });
  }

  const eventKey = buildPaymentEventKey(reference, auditEventType);
  const seen = await hasPaymentEvent(eventKey);

  if (seen) {
    return NextResponse.json({ ok: true, received: true, duplicate: true });
  }

  try {
    const verification = await verifyPaystackTransaction(reference);
    let orderReconcile: Awaited<ReturnType<typeof reconcileOrderAfterVerification>> = null;
    let customOrderReconcile: Awaited<ReturnType<typeof reconcileCustomOrderAfterVerification>> = null;

    if (verification.status) {
      if (verification.data.reference !== reference) {
        await recordPaymentEvent({
          reference,
          eventType: auditEventType,
          payload: {
            ...payload,
            verification: verification.data,
            expectedReference: reference,
            returnedReference: verification.data.reference,
            reason: "reference-mismatch",
          },
          verified: false,
        });

        return NextResponse.json({ ok: true, received: true, referenceMismatch: true });
      }

      orderReconcile = await reconcileOrderAfterVerification(reference, {
        status: verification.data.status,
        amountSubunit: verification.data.amount,
        currency: verification.data.currency,
        paidAt: verification.data.paid_at,
        gatewayResponse: verification.data.gateway_response,
      });
      if (!orderReconcile) {
        customOrderReconcile = await reconcileCustomOrderAfterVerification(reference, {
          status: verification.data.status,
          amountSubunit: verification.data.amount,
          currency: verification.data.currency,
          paidAt: verification.data.paid_at,
          gatewayResponse: verification.data.gateway_response,
        });
      }
    }

    await recordPaymentEvent({
      reference,
      eventType: auditEventType,
      payload: {
        ...payload,
        reconcileTarget: orderReconcile ? "store" : customOrderReconcile ? "custom" : "unknown",
        verification: verification.status ? verification.data : { status: false, message: verification.message },
      },
      verified: verification.status && verification.data.status.toLowerCase() === "success",
    });
  } catch (error) {
    await recordPaymentEvent({
      reference,
      eventType: auditEventType,
      payload: {
        ...payload,
        error: error instanceof Error ? error.message : "unknown-webhook-error",
      },
      verified: false,
    });

    // Return 200 to avoid retry storms; reconciliation can be replayed safely.
    return NextResponse.json({ ok: true, received: true, queued: false });
  }

  return NextResponse.json({ ok: true, received: true });
}
