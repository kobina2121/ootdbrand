import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { formatPriceNgn } from "@/lib/products";
import { getOrdersByUserId } from "@/lib/services/order-service";
import { getCustomOrdersByUserId } from "@/lib/services/custom-order-service";

export default async function AccountOrdersPage() {
 const session = await requireAuthenticatedUser();

 if (!session) {
 return (
 <div className="space-y-6">
 <section className="surface-strong p-5 sm:p-7">
 <p className="heading-kicker">ACCOUNT</p>
 <h1 className="mt-2 font-heading text-5xl leading-none text-[#1f1b18] sm:text-6xl">My Orders</h1>
 <p className="mt-2 text-sm text-[#6d6660] sm:text-base">Sign in to view your order history and delivery updates.</p>
 </section>
 <section className="surface-soft p-6">
 <Link href="/login?next=/orders">
 <Button className="rounded-full">Sign in</Button>
 </Link>
 </section>
 </div>
 );
 }

 const [orders, customOrders] = await Promise.all([
 getOrdersByUserId(session.user.id),
 getCustomOrdersByUserId(session.user.id),
 ]);

 return (
 <div className="space-y-6">
 <section className="surface-strong p-5 sm:p-7">
 <p className="heading-kicker">ACCOUNT</p>
 <h1 className="mt-2 font-heading text-5xl leading-none text-[#1f1b18] sm:text-6xl">My Orders</h1>
 <p className="mt-2 text-sm text-[#6d6660] sm:text-base">
 Track your store purchases and custom orders from one centralized page.
 </p>
 </section>

 <section className="surface-soft p-5 sm:p-6">
 <div className="mb-4 flex items-center justify-between">
 <h2 className="font-heading text-3xl leading-none text-[#1f1b18] sm:text-4xl">Store Orders</h2>
 <Badge variant="outline" className="rounded-full border-black/20 px-3 py-1 text-xs ">
 {orders.length} order(s)
 </Badge>
 </div>
 <div className="space-y-4">
 {orders.length === 0 ? (
 <p className="rounded-xl border border-black/10 bg-white/70 p-4 text-sm text-muted-foreground ">
 No store purchases yet.
 </p>
 ) : (
 orders.map((order) => (
 <article key={order.id} className="space-y-4 rounded-2xl border border-black/10 bg-white/85 p-4 shadow-sm sm:p-5">
 <header className="flex flex-wrap items-start justify-between gap-3">
 <div>
 <p className="text-xs tracking-[0.15em] text-muted-foreground ">Order Ref</p>
 <p className="font-medium text-[#1f1b18] ">{order.paymentReference}</p>
 <p className="text-xs text-muted-foreground ">{new Date(order.createdAt).toLocaleString()}</p>
 </div>
 <div className="flex flex-wrap gap-2">
 <Badge
 variant={order.status === "Success" ? "secondary" : order.status === "Failed" ? "destructive" : "default"}
 className=" "
 >
 Payment: {order.status}
 </Badge>
 <Badge variant="outline" className=" ">Delivery: {order.deliveryStatus}</Badge>
 </div>
 </header>

 <div className="grid gap-3 lg:grid-cols-2">
 {order.items.map((item, itemIndex) => (
 <div key={`${order.id}-${item.productId}-${itemIndex}`} className="flex items-center gap-3 rounded-xl border border-black/10 p-3 ">
 {item.image ? (
 <Image src={item.image} alt={item.productName} width={64} height={64} unoptimized className="h-16 w-16 rounded-lg object-cover" />
 ) : (
 <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-black/5 text-xs text-muted-foreground ">No image</div>
 )}
 <div className="min-w-0 flex-1">
 <p className="truncate font-medium ">{item.productName}</p>
 <p className="text-xs text-muted-foreground ">
 Qty {item.quantity} · {item.variant.size} · {item.variant.colorName}
 </p>
 <p className="text-sm font-medium text-[#443d37] ">{formatPriceNgn(item.lineTotal)}</p>
 </div>
 </div>
 ))}
 </div>

 <div className="grid gap-3 rounded-xl border border-black/10 bg-[#f7f5f1]/80 p-3 text-sm sm:grid-cols-2">
 <p><span className="text-muted-foreground ">Subtotal:</span> {formatPriceNgn(order.amountSubtotal)}</p>
 {order.discountAmount > 0 ? (
 <p><span className="text-muted-foreground ">Discount{order.discountCode ? ` (${order.discountCode})` : ""}:</span> -{formatPriceNgn(order.discountAmount)}</p>
 ) : null}
 <p><span className="text-muted-foreground ">Transaction fee:</span> {formatPriceNgn(order.transactionFee ?? 0)}</p>
 <p><span className="text-muted-foreground ">Total:</span> {formatPriceNgn(order.amountTotal)}</p>
 <p><span className="text-muted-foreground ">Tracking:</span> {order.trackingNumber || "Pending assignment"}</p>
 <p className="truncate"><span className="text-muted-foreground ">Delivery Address:</span> {order.shippingAddress.addressLine}</p>
 <p className="truncate"><span className="text-muted-foreground ">Contact:</span> {order.shippingAddress.phone}</p>
 <p className="truncate"><span className="text-muted-foreground ">Gateway:</span> {order.paymentGatewayStatus || "N/A"}</p>
 </div>

 {order.trackingUrl ? (
 <Link href={order.trackingUrl} target="_blank" rel="noreferrer" className="text-sm text-[#1f1b18] underline ">
 Track shipment
 </Link>
 ) : null}

 <p className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm ">
 <span className="text-muted-foreground ">Admin update:</span> {order.adminUpdate || "No update yet."}
 </p>
 </article>
 ))
 )}
 </div>
 </section>

 <section className="surface-soft p-5 sm:p-6">
 <div className="mb-4 flex items-center justify-between">
 <h2 className="font-heading text-3xl leading-none text-[#1f1b18] sm:text-4xl">Custom Orders</h2>
 <Badge variant="outline" className="rounded-full border-black/20 px-3 py-1 text-xs ">
 {customOrders.length} order(s)
 </Badge>
 </div>
 <div className="space-y-4">
 {customOrders.length === 0 ? (
 <p className="rounded-xl border border-black/10 bg-white/70 p-4 text-sm text-muted-foreground ">
 No custom orders yet.
 </p>
 ) : (
 customOrders.map((order) => {
 const uploadedReferences = order.referenceImages?.length
 ? order.referenceImages
 : order.referenceImage
 ? [order.referenceImage]
 : [];

 return (
 <article key={order.id} className="space-y-4 rounded-2xl border border-black/10 bg-white/85 p-4 shadow-sm sm:p-5">
 <header className="flex flex-wrap items-start justify-between gap-3">
 <div>
 <p className="text-xs tracking-[0.15em] text-muted-foreground ">Custom Ref</p>
 <p className="font-medium text-[#1f1b18] ">{order.paymentReference}</p>
 <p className="text-xs text-muted-foreground ">{new Date(order.createdAt).toLocaleString()}</p>
 </div>
 <div className="flex flex-wrap gap-2">
 <Badge
 variant={order.status === "Success" ? "secondary" : order.status === "Failed" ? "destructive" : "default"}
 className=" "
 >
 Payment: {order.status}
 </Badge>
 <Badge variant="outline" className=" ">Delivery: {order.deliveryStatus}</Badge>
 </div>
 </header>

 <div className="space-y-3 rounded-xl border border-black/10 p-3 ">
 <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
 <div className="space-y-1">
 <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground ">Product image</p>
 {order.productImage ? (
 <Image src={order.productImage} alt={order.productName} width={220} height={220} unoptimized className="h-40 w-full rounded-lg object-cover lg:h-24" />
 ) : (
 <div className="flex h-24 w-full items-center justify-center rounded-lg bg-black/5 text-xs text-muted-foreground ">No product image</div>
 )}
 </div>
 {uploadedReferences.length > 0 ? (
 uploadedReferences.map((image, index) => (
 <div key={`${order.id}-reference-${index}`} className="space-y-1">
 <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground ">
 Uploaded reference {index + 1}
 </p>
 <Image src={image} alt={`Custom order reference ${index + 1}`} width={220} height={220} unoptimized className="h-40 w-full rounded-lg object-cover lg:h-24" />
 </div>
 ))
 ) : (
 <div className="space-y-1">
 <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground ">Uploaded reference</p>
 <div className="flex h-24 w-full items-center justify-center rounded-lg bg-black/5 text-xs text-muted-foreground ">No uploaded reference</div>
 </div>
 )}
 <div className="min-w-0 flex-1 self-center">
 <p className="truncate font-medium ">{order.productName}</p>
 <p className="text-xs text-muted-foreground ">
 {order.category} · {order.size} · {order.color} · SKU {order.variantSku}
 </p>
 <p className="text-sm font-medium text-[#443d37] ">
 {formatPriceNgn(order.baseUnitPrice)} + {formatPriceNgn(order.customizationCharge)} customization + {formatPriceNgn(order.transactionFee ?? 0)} fee
 </p>
 </div>
 </div>
 </div>

 <div className="grid gap-3 rounded-xl border border-black/10 bg-[#f7f5f1]/80 p-3 text-sm sm:grid-cols-2">
 <p><span className="text-muted-foreground ">Transaction fee:</span> {formatPriceNgn(order.transactionFee ?? 0)}</p>
 <p><span className="text-muted-foreground ">Total:</span> {formatPriceNgn(order.amountTotal)}</p>
 <p><span className="text-muted-foreground ">Tracking:</span> {order.trackingNumber || "Pending assignment"}</p>
 <p className="truncate"><span className="text-muted-foreground ">Type:</span> {order.type || "Not specified"}</p>
 <p className="truncate"><span className="text-muted-foreground ">Address:</span> {`${order.deliveryAddress.addressLine}, ${order.deliveryAddress.city}, ${order.deliveryAddress.stateRegion}, ${order.deliveryAddress.country}`}</p>
 <p className="truncate"><span className="text-muted-foreground ">Gateway:</span> {order.paymentGatewayStatus || "N/A"}</p>
 <p className="truncate"><span className="text-muted-foreground ">Specs:</span> {order.measurements}</p>
 </div>

 {order.notes ? (
 <p className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm ">
 <span className="text-muted-foreground ">Your notes:</span> {order.notes}
 </p>
 ) : null}
 {order.trackingUrl ? (
 <Link href={order.trackingUrl} target="_blank" rel="noreferrer" className="text-sm text-[#1f1b18] underline ">
 Track shipment
 </Link>
 ) : null}

 <p className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm ">
 <span className="text-muted-foreground ">Admin update:</span> {order.adminUpdate || "No update yet."}
 </p>
 </article>
 );
 })
 )}
 </div>
 </section>
 </div>
 );
}
