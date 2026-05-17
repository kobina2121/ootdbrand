import { randomUUID } from "node:crypto";

import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/mongoose";
import { OrderModel, type OrderStatus } from "@/lib/db/models/order";
import { calculateShipping } from "@/lib/products";
import { resolveOrderItemsFromCart } from "@/lib/services/product-service";
import type { AppUser } from "@/lib/services/user-service";

export type CheckoutOrderInput = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  items: Array<{
    slug: string;
    name: string;
    image: string;
    size: string;
    color: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  }>;
};

export type VerificationPayload = {
  status: string;
  amountSubunit: number;
  currency: string;
  paidAt?: string | null;
  gatewayResponse?: string;
};

export type ReconcileResult = {
  orderId: string;
  status: OrderStatus;
  changed: boolean;
  reason: "already-success" | "verified-success" | "verification-failed" | "amount-mismatch" | "currency-mismatch";
};

function toValidDate(value?: string | null) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function createPendingOrder(input: CheckoutOrderInput, user?: AppUser | null) {
  await connectToDatabase();
  const resolvedItems = await resolveOrderItemsFromCart(input.items);

  const amountSubtotal = resolvedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shippingFee = calculateShipping(amountSubtotal);
  const amountTotal = amountSubtotal + shippingFee;
  const paymentReference = `PSK-${randomUUID().slice(0, 8).toUpperCase()}`;

  const order = await OrderModel.create({
    userId: user && Types.ObjectId.isValid(user.id) ? new Types.ObjectId(user.id) : undefined,
    items: resolvedItems,
    amountSubtotal,
    shippingFee,
    amountTotal,
    currency: "GHS",
    status: "Pending",
    paymentProvider: "paystack",
    paymentReference,
    shippingAddress: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      addressLine: input.address,
    },
  });

  return {
    id: String(order._id),
    paymentReference,
    amountTotal,
    amountSubtotal,
    shippingFee,
    currency: order.currency,
    status: order.status,
  };
}

export async function getOrderByReference(reference: string) {
  await connectToDatabase();

  const order = await OrderModel.findOne({ paymentReference: reference }).lean();

  if (!order) {
    return null;
  }

  return {
    id: String(order._id),
    paymentReference: order.paymentReference,
    amountTotal: order.amountTotal,
    currency: order.currency,
    status: order.status,
  };
}

export async function reconcileOrderAfterVerification(reference: string, verification: VerificationPayload): Promise<ReconcileResult | null> {
  await connectToDatabase();

  const order = await OrderModel.findOne({ paymentReference: reference }).lean();

  if (!order) {
    return null;
  }

  if (order.status === "Success") {
    return {
      orderId: String(order._id),
      status: "Success",
      changed: false,
      reason: "already-success",
    };
  }

  const expectedAmountSubunit = Math.round(order.amountTotal * 100);
  const sameCurrency = order.currency.toUpperCase() === verification.currency.toUpperCase();
  const sameAmount = expectedAmountSubunit === Math.round(verification.amountSubunit);
  const isGatewaySuccess = verification.status.toLowerCase() === "success";

  if (isGatewaySuccess && sameCurrency && sameAmount) {
    const paidAt = toValidDate(verification.paidAt);
    const update = await OrderModel.findOneAndUpdate(
      { paymentReference: reference, status: { $ne: "Success" } },
      {
        $set: {
          status: "Success",
          paymentGatewayStatus: verification.status,
          paymentGatewayResponse: verification.gatewayResponse ?? "verified-success",
          ...(paidAt ? { paidAt } : {}),
        },
      },
      { new: true },
    ).lean();

    return {
      orderId: String(order._id),
      status: update?.status ?? order.status,
      changed: Boolean(update),
      reason: "verified-success",
    };
  }

  const reason = !isGatewaySuccess
    ? "verification-failed"
    : !sameCurrency
      ? "currency-mismatch"
      : "amount-mismatch";

  const failed = await OrderModel.findOneAndUpdate(
    { paymentReference: reference, status: "Pending" },
    {
      $set: {
        status: "Failed",
        paymentGatewayStatus: verification.status,
        paymentGatewayResponse: verification.gatewayResponse ?? reason,
      },
    },
    { new: true },
  ).lean();

  return {
    orderId: String(order._id),
    status: failed?.status ?? order.status,
    changed: Boolean(failed),
    reason,
  };
}

export async function failPendingOrderByReference(reference: string, reason = "checkout initialization failed") {
  await connectToDatabase();

  const failed = await OrderModel.findOneAndUpdate(
    { paymentReference: reference, status: "Pending" },
    {
      $set: {
        status: "Failed",
        paymentGatewayStatus: "initialize_failed",
        paymentGatewayResponse: reason,
      },
    },
    { new: true },
  ).lean();

  if (!failed) {
    return null;
  }

  return {
    id: String(failed._id),
    paymentReference: failed.paymentReference,
    status: failed.status,
  };
}

export async function listOrders(filters: { status?: OrderStatus; limit?: number } = {}) {
  try {
    await connectToDatabase();

    const query: { status?: OrderStatus } = {};
    if (filters.status) {
      query.status = filters.status;
    }

    const docs = await OrderModel.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit ?? 50)
      .lean();

    return docs.map((doc) => ({
      id: String(doc._id),
      paymentReference: doc.paymentReference,
      customerName: doc.shippingAddress.fullName,
      customerEmail: doc.shippingAddress.email,
      amountTotal: doc.amountTotal,
      status: doc.status,
      createdAt: doc.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function getOrdersByUserId(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    return [];
  }

  await connectToDatabase();
  const docs = await OrderModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).lean();

  return docs.map((doc) => ({
    id: String(doc._id),
    paymentReference: doc.paymentReference,
    amountTotal: doc.amountTotal,
    status: doc.status,
    createdAt: doc.createdAt,
  }));
}
