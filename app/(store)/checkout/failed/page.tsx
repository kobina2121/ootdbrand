import Link from "next/link";

import { ClearCartOnSuccess } from "@/components/store/clear-cart-on-success";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { verifyPaystackTransaction } from "@/lib/paystack/client";
import {
  isCustomOrderReferenceOwnedByUser,
  reconcileCustomOrderAfterVerification,
} from "@/lib/services/custom-order-service";
import { isOrderReferenceOwnedByUser, reconcileOrderAfterVerification } from "@/lib/services/order-service";
import { recordPaymentEvent } from "@/lib/services/payment-event-service";

type FailedPageProps = {
 searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type FailedViewState = "failed" | "pending" | "success";

export default async function OrderFailedPage({ searchParams }: FailedPageProps) {
 const params = await searchParams;
 const reference = typeof params.reference === "string" ? params.reference : "";
 let state: FailedViewState = "failed";
 let successfulOrderType: "store" | "custom" | null = null;

 if (reference) {
 const session = await requireAuthenticatedUser();

 if (!session) {
 return (
 <Card className="mx-auto w-full max-w-xl rounded-3xl border-black/10 bg-white/90 text-center shadow-sm ">
 <CardHeader>
 <CardTitle className="font-heading text-5xl leading-none ">Sign In Required</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <p className="text-sm text-muted-foreground">Sign in to verify this payment and view your order.</p>
 <Link href="/login?next=/checkout/failed">
 <Button className="rounded-full">Sign in</Button>
 </Link>
 </CardContent>
 </Card>
 );
 }

 if (session.user.role !== "admin") {
 const ownsStoreOrder = await isOrderReferenceOwnedByUser(reference, session.user.id);
 const ownsCustomOrder = ownsStoreOrder ? false : await isCustomOrderReferenceOwnedByUser(reference, session.user.id);

 if (!ownsStoreOrder && !ownsCustomOrder) {
 return (
 <Card className="mx-auto w-full max-w-xl rounded-3xl border-black/10 bg-white/90 text-center shadow-sm ">
 <CardHeader>
 <CardTitle className="font-heading text-5xl leading-none ">Order Not Found</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <p className="text-sm text-muted-foreground">This payment reference is not connected to your account.</p>
 <Link href="/orders">
 <Button className="rounded-full">View Orders</Button>
 </Link>
 </CardContent>
 </Card>
 );
 }
 }

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
 const customOrderReconcile =
 orderReconcile ??
 (await reconcileCustomOrderAfterVerification(reference, {
 status: verification.data.status,
 amountSubunit: verification.data.amount,
 currency: verification.data.currency,
 paidAt: verification.data.paid_at,
 gatewayResponse: verification.data.gateway_response,
 }));

 const reconcile = orderReconcile ?? customOrderReconcile;
 state = reconcile?.status === "Success" ? "success" : reconcile?.status === "Failed" ? "failed" : "pending";
 successfulOrderType = state === "success" ? (orderReconcile ? "store" : "custom") : null;
 } else {
 state = "pending";
 }

 await recordPaymentEvent({
 reference,
 eventType: "verify.failed-page",
 payload: verification.status ? verification.data : { status: false, message: verification.message },
 verified: verification.status && verification.data.status.toLowerCase() === "success",
 });
 } catch {
 state = "pending";
 }
 }

 if (state === "success") {
 return (
 <Card className="mx-auto w-full max-w-xl rounded-3xl border-black/10 bg-white/90 text-center shadow-sm ">
 <CardHeader>
 <CardTitle className="font-heading text-5xl leading-none ">Payment Successful</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <ClearCartOnSuccess shouldClear={Boolean(successfulOrderType)} />
 <p className="text-sm text-muted-foreground">Your payment has been confirmed and your order is being prepared.</p>
 <Link href="/orders">
 <Button className="rounded-full">View Orders</Button>
 </Link>
 </CardContent>
 </Card>
 );
 }

 if (state === "pending") {
 return (
 <Card className="mx-auto w-full max-w-xl rounded-3xl border-black/10 bg-white/90 text-center shadow-sm ">
 <CardHeader>
 <CardTitle className="font-heading text-5xl leading-none ">Payment Pending</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <p className="text-sm text-muted-foreground">We have not received final confirmation yet. Please check your orders shortly.</p>
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
 <CardTitle className="font-heading text-5xl leading-none ">Payment Failed</CardTitle>
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
