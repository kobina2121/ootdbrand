import { NextResponse } from "next/server";
import { z } from "zod";

import { failure, success } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { verifyPaystackTransaction } from "@/lib/paystack/client";
import { checkRateLimit } from "@/lib/security/guards";
import {
  isCustomOrderReferenceOwnedByUser,
  reconcileCustomOrderAfterVerification,
} from "@/lib/services/custom-order-service";
import { isOrderReferenceOwnedByUser, reconcileOrderAfterVerification } from "@/lib/services/order-service";
import { recordPaymentEvent } from "@/lib/services/payment-event-service";

const verifyPayloadSchema = z.object({
  reference: z.string().min(5),
});

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(request, {
      bucket: "paystack:verify",
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.ok) {
      return NextResponse.json(failure("Too many payment verification attempts. Please wait and try again."), {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      });
    }

    const json = await request.json();
    const parsed = verifyPayloadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(failure("Invalid verification payload"), { status: 400 });
    }

    const session = await requireAuthenticatedUser();
    if (!session) {
      return NextResponse.json(failure("Please sign in before verifying payment."), { status: 401 });
    }

    if (session.user.role !== "admin") {
      const ownsStoreOrder = await isOrderReferenceOwnedByUser(parsed.data.reference, session.user.id);
      const ownsCustomOrder =
        ownsStoreOrder ? false : await isCustomOrderReferenceOwnedByUser(parsed.data.reference, session.user.id);

      if (!ownsStoreOrder && !ownsCustomOrder) {
        return NextResponse.json(failure("Order not found for this payment reference"), { status: 404 });
      }
    }

    const verification = await verifyPaystackTransaction(parsed.data.reference);

    if (!verification.status) {
      return NextResponse.json(failure(verification.message || "Transaction verification failed"), { status: 400 });
    }

    if (verification.data.reference !== parsed.data.reference) {
      await recordPaymentEvent({
        reference: parsed.data.reference,
        eventType: "verify.endpoint",
        payload: {
          expectedReference: parsed.data.reference,
          returnedReference: verification.data.reference,
          reason: "reference-mismatch",
        },
        verified: false,
      });

      return NextResponse.json(failure("Verification reference mismatch"), { status: 409 });
    }

    const orderReconcile = await reconcileOrderAfterVerification(parsed.data.reference, {
      status: verification.data.status,
      amountSubunit: verification.data.amount,
      currency: verification.data.currency,
      paidAt: verification.data.paid_at,
      gatewayResponse: verification.data.gateway_response,
    });
    const customOrderReconcile =
      orderReconcile ??
      (await reconcileCustomOrderAfterVerification(parsed.data.reference, {
        status: verification.data.status,
        amountSubunit: verification.data.amount,
        currency: verification.data.currency,
        paidAt: verification.data.paid_at,
        gatewayResponse: verification.data.gateway_response,
      }));

    await recordPaymentEvent({
      reference: parsed.data.reference,
      eventType: "verify.endpoint",
      payload: verification.data,
      verified: verification.data.status.toLowerCase() === "success",
    });

    if (!orderReconcile && !customOrderReconcile) {
      return NextResponse.json(failure("Order not found for this payment reference"), { status: 404 });
    }

    const reconcile = orderReconcile ?? customOrderReconcile!;

    return NextResponse.json(
      success("Transaction verified", {
        reference: parsed.data.reference,
        orderStatus: reconcile.status,
        reason: reconcile.reason,
        orderType: orderReconcile ? "store" : "custom",
      }),
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("PAYSTACK_SECRET_KEY")) {
      return NextResponse.json(failure("Payment gateway is not configured"), { status: 500 });
    }

    if (error instanceof Error && error.message.includes("timed out")) {
      return NextResponse.json(failure("Payment verification timed out"), { status: 504 });
    }

    return NextResponse.json(failure("Could not verify transaction"), { status: 500 });
  }
}
