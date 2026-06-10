import Link from "next/link";

import { ClearCartOnSuccess } from "@/components/store/clear-cart-on-success";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyPaystackTransaction } from "@/lib/paystack/client";
import { reconcileCustomOrderAfterVerification } from "@/lib/services/custom-order-service";
import { reconcileOrderAfterVerification } from "@/lib/services/order-service";
import { recordPaymentEvent } from "@/lib/services/payment-event-service";

type SuccessPageProps = {
 searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type SuccessViewState = "missing-reference" | "pending" | "success" | "failed" | "error";

export default async function OrderSuccessPage({ searchParams }: SuccessPageProps) {
 const params = await searchParams;
 const reference = typeof params.reference === "string" ? params.reference : "";

 let state: SuccessViewState = "pending";

 if (!reference) {
 state = "missing-reference";
 } else {
 try {
 const verification = await verifyPaystackTransaction(reference);

 if (!verification.status) {
 state = "pending";
 } else {
 const orderReconcile = await reconcileOrderAfterVerification(reference, {
 status: verification.data.status,
 amountSubunit: verification.data.amount,
 currency: verification.data.currency,
 paidAt: verification.data.paid_at,
 gatewayResponse: verification.data.gateway_response,
 });
 const customOrderReconcile =
 orderReconcile ??
 (await reconcileCustomOrderAfterVerification(reference, {
 status: verification.data.status,
 amountSubunit: verification.data.amount,
 currency: verification.data.currency,
 paidAt: verification.data.paid_at,
 gatewayResponse: verification.data.gateway_response,
 }));

 await recordPaymentEvent({
 reference,
 eventType: "verify.success-page",
 payload: verification.data,
 verified: verification.data.status.toLowerCase() === "success",
 });

 const reconcile = orderReconcile ?? customOrderReconcile;
 state = reconcile?.status === "Success" ? "success" : "failed";
 }
 } catch {
 state = "error";
 }
 }

 if (state === "success") {
 return (
 <Card className="mx-auto w-full max-w-xl rounded-3xl border-black/10 bg-white/90 text-center shadow-sm ">
 <CardHeader>
 <CardTitle className="font-heading text-5xl leading-none ">Payment Successful</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <ClearCartOnSuccess />
 <p className="text-sm text-muted-foreground">Your order has been placed and is being prepared.</p>
 <Link href="/orders">
 <Button className="rounded-full">View Orders</Button>
 </Link>
 </CardContent>
 </Card>
 );
 }

 if (state === "failed") {
 return (
 <Card className="mx-auto w-full max-w-xl rounded-3xl border-black/10 bg-white/90 text-center shadow-sm ">
 <CardHeader>
 <CardTitle className="font-heading text-5xl leading-none ">Payment Failed</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <p className="text-sm text-muted-foreground">Your payment was not confirmed. You can retry checkout.</p>
 <Link href="/checkout">
 <Button variant="outline" className="rounded-full">Return to Checkout</Button>
 </Link>
 </CardContent>
 </Card>
 );
 }

 if (state === "missing-reference") {
 return (
 <Card className="mx-auto w-full max-w-xl rounded-3xl border-black/10 bg-white/90 text-center shadow-sm ">
 <CardHeader>
 <CardTitle className="font-heading text-5xl leading-none ">Payment Reference Missing</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <p className="text-sm text-muted-foreground">We could not verify this payment because no reference was provided.</p>
 <Link href="/orders">
 <Button className="rounded-full">View Orders</Button>
 </Link>
 </CardContent>
 </Card>
 );
 }

 if (state === "error") {
 return (
 <Card className="mx-auto w-full max-w-xl rounded-3xl border-black/10 bg-white/90 text-center shadow-sm ">
 <CardHeader>
 <CardTitle className="font-heading text-5xl leading-none ">Verification Error</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <p className="text-sm text-muted-foreground">We could not verify your payment at the moment. Please check your orders shortly.</p>
 <Link href="/orders">
 <Button className="rounded-full">View Orders</Button>
 </Link>
 </CardContent>
 </Card>
 );
 }

 return (
 <Card className="mx-auto w-full max-w-xl rounded-3xl border-black/10 bg-white/90 text-center shadow-sm ">
 <CardHeader>
 <CardTitle className="font-heading text-5xl leading-none ">Payment Pending</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <p className="text-sm text-muted-foreground">We are still awaiting confirmation from the payment gateway.</p>
 <Link href="/orders">
 <Button className="rounded-full">View Orders</Button>
 </Link>
 </CardContent>
 </Card>
 );
}
