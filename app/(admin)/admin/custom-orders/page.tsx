import Link from "next/link";
import { Ruler } from "lucide-react";

import { OrderTableActions } from "@/components/admin/order-table-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPriceNgn } from "@/lib/products";
import { listCustomOrders } from "@/lib/services/custom-order-service";

type AdminCustomOrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCustomOrdersPage({ searchParams }: AdminCustomOrdersPageProps) {
  const params = await searchParams;
  const statusParam = typeof params.status === "string" ? params.status : "all";
  const status = statusParam === "Pending" || statusParam === "Success" || statusParam === "Failed" ? statusParam : "all";
  const pageParam = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize = 12;

  const allCustomOrders = await listCustomOrders({ status: status === "all" ? undefined : status });
  const totalPages = Math.max(1, Math.ceil(allCustomOrders.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const customOrders = allCustomOrders.slice((safePage - 1) * pageSize, safePage * pageSize);

  const successCount = allCustomOrders.filter((order) => order.status === "Success").length;
  const pendingCount = allCustomOrders.filter((order) => order.status === "Pending").length;
  const failedCount = allCustomOrders.filter((order) => order.status === "Failed").length;

  const buildHref = (nextPage: number, nextStatus = status) => {
    const query = new URLSearchParams();
    query.set("page", String(nextPage));
    if (nextStatus !== "all") {
      query.set("status", nextStatus);
    }

    return `/admin/custom-orders?${query.toString()}`;
  };

  return (
    <div className="space-y-5">
      <Card className="border-black/10 bg-white/85 shadow-sm">
        <CardHeader className="space-y-4">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.16em] text-muted-foreground">Tailoring Queue</p>
            <CardTitle className="font-sans text-2xl font-semibold">Custom Orders</CardTitle>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-black/10 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total requests</p>
              <p className="text-lg font-semibold">{allCustomOrders.length}</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Success</p>
              <p className="text-lg font-semibold">{successCount}</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending</p>
              <p className="text-lg font-semibold">{pendingCount}</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Failed</p>
              <p className="text-lg font-semibold">{failedCount}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={buildHref(1, "all")}>
              <Badge variant={status === "all" ? "default" : "outline"} className="rounded-full px-3 py-1">
                All
              </Badge>
            </Link>
            <Link href={buildHref(1, "Pending")}>
              <Badge variant={status === "Pending" ? "default" : "outline"} className="rounded-full px-3 py-1">
                Pending
              </Badge>
            </Link>
            <Link href={buildHref(1, "Success")}>
              <Badge variant={status === "Success" ? "default" : "outline"} className="rounded-full px-3 py-1">
                Success
              </Badge>
            </Link>
            <Link href={buildHref(1, "Failed")}>
              <Badge variant={status === "Failed" ? "default" : "outline"} className="rounded-full px-3 py-1">
                Failed
              </Badge>
            </Link>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-black/10 bg-white/90 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Reference</TableHead>
                <TableHead>Customer & Delivery</TableHead>
                <TableHead>Product & Customization</TableHead>
                <TableHead>Payment & Tracking</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Quick Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Ruler className="size-6 text-muted-foreground" />
                      <p>No custom orders yet.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                customOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <p className="font-medium">{order.paymentReference}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <p className="font-medium">{order.fullName}</p>
                        <p className="text-xs text-muted-foreground">{order.email}</p>
                        <p className="text-xs text-muted-foreground">{order.phone}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.deliveryAddress.addressLine}, {order.deliveryAddress.city}, {order.deliveryAddress.stateRegion},{" "}
                          {order.deliveryAddress.country}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-2">
                        <div className="flex items-start gap-3 rounded-md border border-black/10 p-2">
                          <div className="h-16 w-16 overflow-hidden rounded-md border border-black/10 bg-muted/40">
                            {order.referenceImage || order.productImage ? (
                              <img
                                src={order.referenceImage || order.productImage}
                                alt={order.referenceImage ? `${order.productName} reference` : order.productName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[0.65rem] text-muted-foreground">
                                No image
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{order.productName}</p>
                            <p className="text-xs text-muted-foreground">Slug: {order.productSlug}</p>
                            <p className="text-xs text-muted-foreground">Variant SKU: {order.variantSku}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.category} · {order.size} · {order.color}
                            </p>
                            {order.type ? <p className="text-xs text-muted-foreground">Type: {order.type}</p> : null}
                          </div>
                        </div>
                        <div className="rounded-md border border-black/10 p-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customization details</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Preferred size:</span> {order.size}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Preferred color:</span> {order.color}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Bust:</span> {order.bustSize || "N/A"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Waist:</span> {order.waistSize || "N/A"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Hip:</span> {order.hipSize || "N/A"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Additional:</span> {order.additionalMeasurements || "N/A"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Notes:</span> {order.notes || "No notes"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Reference image:</span>{" "}
                            {order.referenceImage ? "Uploaded" : "None"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Provider: {order.paymentProvider ?? "paystack"}</p>
                        <p className="text-xs text-muted-foreground">Product price: {formatPriceNgn(order.baseUnitPrice)}</p>
                        <p className="text-xs text-muted-foreground">Customization fee: {formatPriceNgn(order.customizationCharge)}</p>
                        <p className="text-sm font-semibold">Total: {formatPriceNgn(order.amountTotal)}</p>
                        <p className="text-xs text-muted-foreground">Gateway status: {order.paymentGatewayStatus || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">Gateway response: {order.paymentGatewayResponse || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">
                          Paid at: {order.paidAt ? new Date(order.paidAt).toLocaleString() : "Not paid yet"}
                        </p>
                        <p className="text-xs text-muted-foreground">Delivery: {order.deliveryStatus}</p>
                        <p className="text-xs text-muted-foreground">Tracking: {order.trackingNumber || "Pending assignment"}</p>
                        {order.trackingUrl ? (
                          <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="text-xs text-[#1f1b18] underline">
                            Open tracking link
                          </a>
                        ) : null}
                        <p className="text-xs text-muted-foreground">Admin update: {order.adminUpdate || "No update yet."}</p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <Badge
                          variant={order.status === "Success" ? "secondary" : order.status === "Failed" ? "destructive" : "default"}
                        >
                          {order.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">{order.deliveryStatus}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <OrderTableActions reference={order.paymentReference} customerEmail={order.email} orderType="custom" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Link
          href={buildHref(Math.max(1, safePage - 1))}
          aria-disabled={safePage <= 1}
          className={safePage <= 1 ? "pointer-events-none opacity-50" : ""}
        >
          <Button variant="outline" size="sm" className="rounded-full">Prev</Button>
        </Link>
        <Badge variant="outline" className="rounded-full border-black/20">
          Page {safePage} of {totalPages}
        </Badge>
        <Link
          href={buildHref(Math.min(totalPages, safePage + 1))}
          aria-disabled={safePage >= totalPages}
          className={safePage >= totalPages ? "pointer-events-none opacity-50" : ""}
        >
          <Button variant="outline" size="sm" className="rounded-full">Next</Button>
        </Link>
      </div>
    </div>
  );
}
