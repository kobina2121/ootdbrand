import Link from "next/link";

import { ClearCartOnSuccess } from "@/components/store/clear-cart-on-success";
import { PurchaseThankYouDialog } from "@/components/store/purchase-thank-you-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { verifyPaystackTransaction } from "@/lib/paystack/client";
import {
  getCustomOrderDetailsByReference,
  isCustomOrderReferenceOwnedByUser,
  reconcileCustomOrderAfterVerification,
} from "@/lib/services/custom-order-service";
import {
  getOrderDetailsByReference,
  isOrderReferenceOwnedByUser,
  reconcileOrderAfterVerification,
} from "@/lib/services/order-service";
import { recordPaymentEvent } from "@/lib/services/payment-event-service";

type FailedPageProps = {
 searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type FailedViewState = "failed" | "pending" | "success";

export default async function OrderFailedPage({ searchParams }: FailedPageProps) {
 const params = await searchParams;
 const reference = typeof params.reference === "string" ? params.reference : "";
 let state: FailedViewState = "failed";
 let checkoutOrderType: "store" | "custom" | null = null;
 let customerName = "Customer";

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
 customerName = session.user.name?.trim() || "Customer";
 const ownsStoreOrder = await isOrderReferenceOwnedByUser(reference, session.user.id);
 const ownsCustomOrder = ownsStoreOrder ? false : await isCustomOrderReferenceOwnedByUser(reference, session.user.id);
 checkoutOrderType = ownsStoreOrder ? "store" : ownsCustomOrder ? "custom" : null;
 if (checkoutOrderType === "store") {
 const orderDetails = await getOrderDetailsByReference(reference, session.user.id);
 customerName = orderDetails?.shippingAddress.fullName?.trim() || customerName;
 } else if (checkoutOrderType === "custom") {
 const customOrderDetails = await getCustomOrderDetailsByReference(reference, session.user.id);
 customerName = customOrderDetails?.fullName?.trim() || customerName;
 }

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
 checkoutOrderType = reconcile ? (orderReconcile ? "store" : "custom") : null;
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
 <PurchaseThankYouDialog
 customerName={customerName}
 orderHref={`/orders/${encodeURIComponent(reference)}`}
 status="success"
 />
 <CardHeader>
 <CardTitle className="font-heading text-5xl leading-none ">Payment Successful</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <ClearCartOnSuccess shouldClear={checkoutOrderType === "store"} />
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
 <ClearCartOnSuccess shouldClear={checkoutOrderType === "store"} />
 {checkoutOrderType ? (
 <PurchaseThankYouDialog
 customerName={customerName}
 orderHref={`/orders/${encodeURIComponent(reference)}`}
 status="pending"
 />
 ) : null}
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
