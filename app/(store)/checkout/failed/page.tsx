import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyPaystackTransaction } from "@/lib/paystack/client";
import { reconcileCustomOrderAfterVerification } from "@/lib/services/custom-order-service";
import { reconcileOrderAfterVerification } from "@/lib/services/order-service";
import { recordPaymentEvent } from "@/lib/services/payment-event-service";

type FailedPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrderFailedPage({ searchParams }: FailedPageProps) {
  const params = await searchParams;
  const reference = typeof params.reference === "string" ? params.reference : "";

  if (reference) {
    try {
      const verification = await verifyPaystackTransaction(reference);

      if (verification.status) {
        const orderReconcile = await reconcileOrderAfterVerification(reference, {
          status: verification.data.status,
          amountSubunit: verification.data.amount,
          currency: verification.data.currency,
          paidAt: verification.data.paid_at,
          gatewayResponse: verification.data.gateway_response,
        });
        if (!orderReconcile) {
          await reconcileCustomOrderAfterVerification(reference, {
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
        eventType: "verify.failed-page",
        payload: verification.status ? verification.data : { status: false, message: verification.message },
        verified: verification.status && verification.data.status.toLowerCase() === "success",
      });
    } catch {
      // Fall back to failed-state UI while webhook/callback reconciliation retries.
    }
  }

  return (
    <Card className="mx-auto w-full max-w-xl rounded-3xl border-black/10 bg-white/90 text-center shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-5xl leading-none">Payment Failed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">We could not confirm your transaction. Please try again.</p>
        <Link href="/checkout">
          <Button variant="outline" className="rounded-full">Return to Checkout</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
