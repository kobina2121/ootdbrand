import { NextResponse } from "next/server";
import { z } from "zod";

import { failure, success } from "@/lib/api-response";
import { verifyPaystackTransaction } from "@/lib/paystack/client";
import { reconcileOrderAfterVerification } from "@/lib/services/order-service";
import { recordPaymentEvent } from "@/lib/services/payment-event-service";

const verifyPayloadSchema = z.object({
  reference: z.string().min(5),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = verifyPayloadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(failure("Invalid verification payload"), { status: 400 });
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

    const reconcile = await reconcileOrderAfterVerification(parsed.data.reference, {
      status: verification.data.status,
      amountSubunit: verification.data.amount,
      currency: verification.data.currency,
      paidAt: verification.data.paid_at,
      gatewayResponse: verification.data.gateway_response,
    });

    await recordPaymentEvent({
      reference: parsed.data.reference,
      eventType: "verify.endpoint",
      payload: verification.data,
      verified: verification.data.status.toLowerCase() === "success",
    });

    if (!reconcile) {
      return NextResponse.json(failure("Order not found for this payment reference"), { status: 404 });
    }

    return NextResponse.json(
      success("Transaction verified", {
        reference: parsed.data.reference,
        orderStatus: reconcile.status,
        reason: reconcile.reason,
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
