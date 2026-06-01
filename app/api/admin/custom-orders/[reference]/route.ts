import { NextResponse } from "next/server";
import { z } from "zod";

import { failure, success } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth/guards";
import { CustomOrderModel } from "@/lib/db/models/custom-order";
import { connectToDatabase } from "@/lib/db/mongoose";

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
    } else if (payload.deliveryStatus === "Shipped") {
      update.adminUpdate = "Your custom order is being delivered.";
    }

    const customOrder = await CustomOrderModel.findOneAndUpdate(
      { paymentReference: reference },
      { $set: update },
      { returnDocument: "after" },
    ).lean();

    if (!customOrder) {
      return NextResponse.json(failure("Custom order not found"), { status: 404 });
    }

    return NextResponse.json(success("Custom order updated", { id: String(customOrder._id) }));
  } catch {
    return NextResponse.json(failure("Could not update custom order"), { status: 500 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json(failure("Unauthorized"), { status: 403 });
  }

  try {
    const { reference } = await context.params;
    await connectToDatabase();

    const deleted = await CustomOrderModel.findOneAndDelete({ paymentReference: reference }).lean();
    if (!deleted) {
      return NextResponse.json(failure("Custom order not found"), { status: 404 });
    }

    return NextResponse.json(success("Custom order deleted", { id: String(deleted._id) }));
  } catch {
    return NextResponse.json(failure("Could not delete custom order"), { status: 500 });
  }
}
