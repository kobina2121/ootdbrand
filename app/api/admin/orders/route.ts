import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/guards";
import { failure, success } from "@/lib/api-response";
import { listOrders } from "@/lib/services/order-service";
import { orderStatusSchema } from "@/lib/validators/admin";

export async function GET(request: Request) {
  const admin = await requireAdminUser();

  if (!admin) {
    return NextResponse.json(failure("Unauthorized"), { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    const parsedStatus = statusParam ? orderStatusSchema.safeParse(statusParam) : null;
    if (statusParam && !parsedStatus?.success) {
      return NextResponse.json(failure("Invalid order status"), { status: 400 });
    }

    const orders = await listOrders({ status: parsedStatus?.success ? parsedStatus.data : undefined });

    return NextResponse.json(success("Orders fetched", { orders }));
  } catch {
    return NextResponse.json(failure("Could not fetch orders"), { status: 500 });
  }
}
