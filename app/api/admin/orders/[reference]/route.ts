import { NextResponse } from "next/server";
import { z } from "zod";

import { failure, success } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth/guards";
import { OrderModel } from "@/lib/db/models/order";
import { connectToDatabase } from "@/lib/db/mongoose";
import { checkRateLimit } from "@/lib/security/guards";

const deliveryUpdateSchema = z.object({
  deliveryStatus: z.enum(["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]).optional(),
  trackingNumber: z.string().trim().max(120).optional(),
  trackingUrl: z.string().trim().url().max(500).optional(),
  adminUpdate: z.string().trim().max(500).optional(),
});

type RouteContext = {
  params: Promise<{
    reference: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const rateLimit = checkRateLimit(request, {
    bucket: "admin:orders:update",
    limit: 40,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json(failure("Too many order update requests. Please retry shortly."), {
      status: 429,
      headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
    });
  }

  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json(failure("Unauthorized"), { status: 403 });
  }

  try {
    const { reference } = await context.params;
    const parsed = deliveryUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("Invalid payload"), { status: 400 });
    }

    const payload = parsed.data;
    if (!payload.deliveryStatus && !payload.trackingNumber && !payload.trackingUrl && !payload.adminUpdate) {
      return NextResponse.json(failure("No update provided"), { status: 400 });
    }

    await connectToDatabase();

    const update: Record<string, string> = {};
    if (payload.deliveryStatus) {
      update.deliveryStatus = payload.deliveryStatus;
    }
    if (payload.trackingNumber !== undefined) {
      update.trackingNumber = payload.trackingNumber;
    }
    if (payload.trackingUrl !== undefined) {
      update.trackingUrl = payload.trackingUrl;
    }
    if (payload.adminUpdate !== undefined) {
      update.adminUpdate = payload.adminUpdate;
    } else if (payload.deliveryStatus === "Delivered") {
      update.adminUpdate = "Your order has been delivered.";
    } else if (payload.deliveryStatus === "Shipped") {
      update.adminUpdate = "Your order is being delivered.";
    }

    const order = await OrderModel.findOneAndUpdate(
      { paymentReference: reference },
      { $set: update },
      { returnDocument: "after" },
    ).lean();

    if (!order) {
      return NextResponse.json(failure("Order not found"), { status: 404 });
    }

    return NextResponse.json(success("Order updated", { id: String(order._id) }));
  } catch {
    return NextResponse.json(failure("Could not update order"), { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const rateLimit = checkRateLimit(request, {
    bucket: "admin:orders:delete",
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json(failure("Too many order delete requests. Please retry shortly."), {
      status: 429,
      headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
    });
  }

  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json(failure("Unauthorized"), { status: 403 });
  }

  try {
    const { reference } = await context.params;
    await connectToDatabase();

    const deleted = await OrderModel.findOneAndDelete({ paymentReference: reference }).lean();
    if (!deleted) {
      return NextResponse.json(failure("Order not found"), { status: 404 });
    }

    return NextResponse.json(success("Order deleted", { id: String(deleted._id) }));
  } catch {
    return NextResponse.json(failure("Could not delete order"), { status: 500 });
  }
}
