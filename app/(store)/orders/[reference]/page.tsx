import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { formatPriceNgn } from "@/lib/products";
import { getCustomOrderDetailsByReference } from "@/lib/services/custom-order-service";
import { getOrderDetailsByReference } from "@/lib/services/order-service";

export const metadata: Metadata = {
  title: "Order Details",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

type CustomerOrderDetailsPageProps = {
  params: Promise<{
    reference: string;
  }>;
};

function paymentStatusBadgeClass(status: string) {
  if (status === "Success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50";
  }

  return "";
}

export default async function CustomerOrderDetailsPage({ params }: CustomerOrderDetailsPageProps) {
  const session = await requireAuthenticatedUser();

  if (!session) {
    return (
      <div className="space-y-6">
        <section className="surface-strong p-5 sm:p-7">
          <p className="heading-kicker">ACCOUNT</p>
          <h1 className="mt-2 font-heading text-5xl leading-none text-[#1f1b18] sm:text-6xl">Order Details</h1>
          <p className="mt-2 text-sm text-[#6d6660] sm:text-base">Sign in to view your order details.</p>
        </section>
        <section className="surface-soft p-6">
          <Link href="/login?next=/orders">
            <Button className="rounded-full">Sign in</Button>
          </Link>
        </section>
      </div>
    );
  }

  const { reference } = await params;
  const decodedReference = decodeURIComponent(reference);
  const [storeOrder, customOrder] = await Promise.all([
    getOrderDetailsByReference(decodedReference, session.user.id),
    getCustomOrderDetailsByReference(decodedReference, session.user.id),
  ]);

  if (!storeOrder && !customOrder) {
    notFound();
  }

  if (storeOrder) {
    return (
      <div className="space-y-6">
        <section className="surface-strong p-5 sm:p-7">
          <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground">
            Back to my orders
          </Link>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="heading-kicker">STORE ORDER</p>
              <h1 className="mt-2 font-heading text-5xl leading-none text-[#1f1b18] sm:text-6xl">{storeOrder.paymentReference}</h1>
            </div>
            <Badge variant={storeOrder.status === "Failed" ? "destructive" : "outline"} className={paymentStatusBadgeClass(storeOrder.status)}>
              {storeOrder.status}
            </Badge>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <Card className="border-black/10 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {storeOrder.items.map((item) => (
                <div key={item.variant.sku} className="flex gap-3 rounded-2xl border border-black/10 p-3">
                  {item.image ? (
                    <Image src={item.image} alt={item.productName} width={88} height={104} unoptimized className="h-24 w-20 rounded-xl object-cover" />
                  ) : null}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} · Size: {item.variant.size} · Color: {item.variant.colorName}
                    </p>
                    <p className="text-sm font-semibold">{formatPriceNgn(item.lineTotal)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="border-black/10 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Subtotal: {formatPriceNgn(storeOrder.amountSubtotal)}</p>
                {storeOrder.discountAmount > 0 ? <p>Discount: -{formatPriceNgn(storeOrder.discountAmount)}</p> : null}
                <p>Transaction fee: {formatPriceNgn(storeOrder.transactionFee)}</p>
                <p className="font-semibold text-foreground">Total: {formatPriceNgn(storeOrder.amountTotal)}</p>
                <p>Paid at: {storeOrder.paidAt ? new Date(storeOrder.paidAt).toLocaleString() : "Not paid yet"}</p>
              </CardContent>
            </Card>

            <Card className="border-black/10 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle>Delivery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Status: {storeOrder.deliveryStatus}</p>
                <p>Tracking number: {storeOrder.trackingNumber || "Pending"}</p>
                <p>Tracking URL: {storeOrder.trackingUrl || "Pending"}</p>
                <p>Delivery address: {storeOrder.deliveryAddress}</p>
                <p>Update: {storeOrder.adminUpdate || "No update yet"}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const order = customOrder!;

  return (
    <div className="space-y-6">
      <section className="surface-strong p-5 sm:p-7">
        <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground">
          Back to my orders
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="heading-kicker">CUSTOM ORDER</p>
            <h1 className="mt-2 font-heading text-5xl leading-none text-[#1f1b18] sm:text-6xl">{order.paymentReference}</h1>
          </div>
          <Badge variant={order.status === "Failed" ? "destructive" : "outline"} className={paymentStatusBadgeClass(order.status)}>
            {order.status}
          </Badge>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <Card className="border-black/10 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle>Custom Piece</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 rounded-2xl border border-black/10 p-3">
              {order.productImage ? (
                <Image src={order.productImage} alt={order.productName} width={88} height={104} unoptimized className="h-24 w-20 rounded-xl object-cover" />
              ) : null}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium">{order.productName}</p>
                <p className="text-sm text-muted-foreground">
                  {order.category} · {order.type || "Custom request"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Preferred size: {order.size} · Color: {order.color}
                </p>
                <p className="text-sm font-semibold">{formatPriceNgn(order.amountTotal)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Measurements</p>
              <p>Bust: {order.bustSize || "N/A"}</p>
              <p>Waist: {order.waistSize || "N/A"}</p>
              <p>Hip: {order.hipSize || "N/A"}</p>
              <p>Additional: {order.additionalMeasurements || "N/A"}</p>
              <p className="mt-3">Notes: {order.notes || "No notes provided"}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-black/10 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Base price: {formatPriceNgn(order.baseUnitPrice)}</p>
              <p>Customization: {formatPriceNgn(order.customizationCharge)}</p>
              <p>Transaction fee: {formatPriceNgn(order.transactionFee)}</p>
              <p className="font-semibold text-foreground">Total: {formatPriceNgn(order.amountTotal)}</p>
              <p>Paid at: {order.paidAt ? new Date(order.paidAt).toLocaleString() : "Not paid yet"}</p>
            </CardContent>
          </Card>

          <Card className="border-black/10 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Status: {order.deliveryStatus}</p>
              <p>Tracking number: {order.trackingNumber || "Pending"}</p>
              <p>Tracking URL: {order.trackingUrl || "Pending"}</p>
              <p>
                Delivery address: {order.deliveryAddress.addressLine}, {order.deliveryAddress.city}, {order.deliveryAddress.stateRegion}, {order.deliveryAddress.country}
              </p>
              <p>Update: {order.adminUpdate || "No update yet"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
