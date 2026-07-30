import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderTableActions } from "@/components/admin/order-table-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPriceNgn } from "@/lib/products";
import { getOrderDetailsByReference } from "@/lib/services/order-service";

type AdminOrderDetailsPageProps = {
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

export default async function AdminOrderDetailsPage({ params }: AdminOrderDetailsPageProps) {
  const { reference } = await params;
  const order = await getOrderDetailsByReference(decodeURIComponent(reference));

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
            Back to orders
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Order {order.paymentReference}</h1>
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
          <OrderTableActions reference={order.paymentReference} customerEmail={order.customerEmail} orderType="store" />
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <Card className="border-black/10 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle>Items Ordered</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item) => (
              <div key={item.variant.sku} className="flex gap-3 rounded-2xl border border-black/10 p-3">
                {item.image ? (
                  <Image src={item.image} alt={item.productName} width={88} height={104} unoptimized className="h-24 w-20 rounded-xl object-cover" />
                ) : null}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity} · Size: {item.variant.size} · Color: {item.variant.colorName}
                  </p>
                  <p className="text-xs text-muted-foreground">SKU: {item.variant.sku}</p>
                  <p className="text-sm font-semibold">{formatPriceNgn(item.lineTotal)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-black/10 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{order.customerName}</p>
              <p>{order.customerEmail}</p>
              <p>{order.customerPhone}</p>
              <p>{order.deliveryAddress}</p>
              <a href={`mailto:${order.customerEmail}?subject=Order%20Update%20(${encodeURIComponent(order.paymentReference)})`}>
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
              <p>Subtotal: {formatPriceNgn(order.amountSubtotal)}</p>
              {order.discountAmount > 0 ? <p>Discount: -{formatPriceNgn(order.discountAmount)}</p> : null}
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
