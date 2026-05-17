import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { formatPriceNgn } from "@/lib/products";
import { getOrdersByUserId } from "@/lib/services/order-service";

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

  const orders = await getOrdersByUserId(session.user.id);

  return (
    <div className="space-y-6">
      <section className="surface-strong p-5 sm:p-7">
        <p className="heading-kicker">ACCOUNT</p>
        <h1 className="mt-2 font-heading text-5xl leading-none text-[#1f1b18] sm:text-6xl">My Orders</h1>
        <p className="mt-2 text-sm text-[#6d6660] sm:text-base">Track every purchase and payment status in one place.</p>
      </section>
      <section className="surface-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No orders yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.paymentReference}</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{formatPriceNgn(order.amountTotal)}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === "Success" ? "secondary" : order.status === "Failed" ? "destructive" : "default"}>
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
