import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderTableActions } from "@/components/admin/order-table-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPriceNgn } from "@/lib/products";
import { getCustomOrderDetailsByReference } from "@/lib/services/custom-order-service";

type AdminCustomOrderDetailsPageProps = {
  params: Promise<{
    reference: string;
  }>;
};

function statusBadgeClass(status: string) {
  if (status === "Success") {
    return "bg-emerald-600 text-white hover:bg-emerald-600";
  }

  return undefined;
}

export default async function AdminCustomOrderDetailsPage({ params }: AdminCustomOrderDetailsPageProps) {
  const { reference } = await params;
  const order = await getCustomOrderDetailsByReference(decodeURIComponent(reference));

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/custom-orders" className="text-sm text-muted-foreground hover:text-foreground">
            Back to custom orders
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Custom Order {order.paymentReference}</h1>
        </div>
        <Badge variant={order.status === "Failed" ? "destructive" : "default"} className={statusBadgeClass(order.status)}>
          {order.status}
        </Badge>
      </div>

      <Card className="border-black/10 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTableActions reference={order.paymentReference} customerEmail={order.email} orderType="custom" />
        </CardContent>
      </Card>

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
                <p className="text-xs text-muted-foreground">Base SKU: {order.variantSku}</p>
                <p className="text-sm font-semibold">{formatPriceNgn(order.amountTotal)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Measurements</p>
              <p>Bust: {order.bustSize || "N/A"}</p>
              <p>Waist: {order.waistSize || "N/A"}</p>
              <p>Hip: {order.hipSize || "N/A"}</p>
              <p>Original measurements: {order.measurements || "N/A"}</p>
              <p>Additional: {order.additionalMeasurements || "N/A"}</p>
              <p className="mt-3">Notes: {order.notes || "No notes provided"}</p>
            </div>

            {order.referenceImages.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {order.referenceImages.map((image) => (
                  <Image key={image} src={image} alt="Customer reference" width={500} height={620} unoptimized className="rounded-2xl border border-black/10 object-cover" />
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-black/10 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{order.fullName}</p>
              <p>{order.email}</p>
              <p>{order.phone}</p>
              <p>
                {order.deliveryAddress.addressLine}, {order.deliveryAddress.city}, {order.deliveryAddress.stateRegion}, {order.deliveryAddress.country}
              </p>
              <a href={`mailto:${order.email}?subject=Custom%20Order%20Update%20(${encodeURIComponent(order.paymentReference)})`}>
                <Button size="sm" variant="outline" className="mt-2 rounded-full">
                  Email Customer
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="border-black/10 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Provider: {order.paymentProvider}</p>
              <p>Base price: {formatPriceNgn(order.baseUnitPrice)}</p>
              <p>Customization: {formatPriceNgn(order.customizationCharge)}</p>
              <p>Transaction fee: {formatPriceNgn(order.transactionFee)}</p>
              <p className="font-semibold text-foreground">Total: {formatPriceNgn(order.amountTotal)}</p>
              <p>Gateway status: {order.paymentGatewayStatus || "N/A"}</p>
              <p>Gateway response: {order.paymentGatewayResponse || "N/A"}</p>
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
              <p>Admin update: {order.adminUpdate || "No update yet"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
