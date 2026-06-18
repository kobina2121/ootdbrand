import { randomUUID } from "node:crypto";

import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/mongoose";
import { OrderModel, type OrderStatus } from "@/lib/db/models/order";
import { resolveDiscount } from "@/lib/discounts";
import { ProductModel } from "@/lib/db/models/product";
import { calculateShipping, calculateTransactionFee } from "@/lib/products";
import { resolveOrderItemsFromCart } from "@/lib/services/product-service";
import type { AppUser } from "@/lib/services/user-service";

export type CheckoutOrderInput = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  discountCode?: string;
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
  const pricingItems = resolvedItems.map((item) => ({
    slug: item.productId,
    name: item.productNameSnapshot,
    image: "",
    size: item.variant.size,
    color: item.variant.color.name,
    sku: item.variant.sku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }));

  const amountSubtotal = resolvedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discount = resolveDiscount(pricingItems, input.discountCode);

  if (discount.requestedCode && !discount.appliedCode) {
    throw new Error(discount.message ?? "Invalid coupon code.");
  }

  const discountedSubtotal = Math.max(0, amountSubtotal - discount.amount);
  const shippingFee = calculateShipping(discountedSubtotal);
  const transactionFee = calculateTransactionFee(discountedSubtotal);
  const amountTotal = discountedSubtotal + shippingFee + transactionFee;
  const paymentReference = `PSK-${randomUUID().slice(0, 8).toUpperCase()}`;

  const order = await OrderModel.create({
    userId: user && Types.ObjectId.isValid(user.id) ? new Types.ObjectId(user.id) : undefined,
    items: resolvedItems,
    amountSubtotal,
    discountCode: discount.appliedCode ?? undefined,
    discountAmount: discount.amount,
    shippingFee,
    transactionFee,
    amountTotal,
    currency: "GHS",
    status: "Pending",
    deliveryStatus: "Pending",
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
    discountCode: discount.appliedCode,
    discountAmount: discount.amount,
    shippingFee,
    transactionFee,
    currency: order.currency,
    status: order.status,
    createdAt: order.createdAt,
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
      { returnDocument: "after" },
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
    { returnDocument: "after" },
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
    { returnDocument: "after" },
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

    const productIds = Array.from(
      new Set(
        docs.flatMap((doc) =>
          doc.items
            .map((item) => String(item.productId))
            .filter((productId) => Types.ObjectId.isValid(productId)),
        ),
      ),
    ).map((id) => new Types.ObjectId(id));

    const products = productIds.length
      ? await ProductModel.find({ _id: { $in: productIds } })
          .select({ _id: 1, images: 1 })
          .lean()
      : [];

    const productImageMap = new Map<string, string>(
      products.map((product) => [String(product._id), product.images?.[0] || ""]),
    );

    return docs.map((doc) => ({
      id: String(doc._id),
      paymentReference: doc.paymentReference,
      customerName: doc.shippingAddress.fullName,
      customerEmail: doc.shippingAddress.email,
      customerPhone: doc.shippingAddress.phone,
      deliveryAddress: doc.shippingAddress.addressLine,
      items: doc.items.map((item) => ({
        productId: String(item.productId),
        productName: item.productNameSnapshot,
        image: productImageMap.get(String(item.productId)) ?? "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.unitPrice * item.quantity,
        variant: {
          size: item.variant?.size ?? "",
          colorName: item.variant?.color?.name ?? "",
          colorCode: item.variant?.color?.code ?? "#9CA3AF",
          sku: item.variant?.sku ?? "",
        },
      })),
      amountSubtotal: doc.amountSubtotal,
      discountCode: doc.discountCode ?? "",
      discountAmount: doc.discountAmount ?? 0,
      shippingFee: doc.shippingFee,
      transactionFee: doc.transactionFee ?? 0,
      amountTotal: doc.amountTotal,
      currency: doc.currency,
      status: doc.status,
      deliveryStatus: doc.deliveryStatus ?? "Pending",
      trackingNumber: doc.trackingNumber ?? "",
      trackingUrl: doc.trackingUrl ?? "",
      adminUpdate: doc.adminUpdate ?? "",
      paymentProvider: doc.paymentProvider,
      paymentGatewayStatus: doc.paymentGatewayStatus ?? "",
      paymentGatewayResponse: doc.paymentGatewayResponse ?? "",
      paidAt: doc.paidAt ?? null,
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

  const productIds = Array.from(
    new Set(
      docs.flatMap((doc) =>
        doc.items
          .map((item) => String(item.productId))
          .filter((productId) => Types.ObjectId.isValid(productId)),
      ),
    ),
  ).map((id) => new Types.ObjectId(id));

  const products = productIds.length
    ? await ProductModel.find({ _id: { $in: productIds } })
        .select({ _id: 1, images: 1 })
        .lean()
    : [];

  const productImageMap = new Map<string, string>(
    products.map((product) => [String(product._id), product.images?.[0] || ""]),
  );

  return docs.map((doc) => ({
    id: String(doc._id),
    paymentReference: doc.paymentReference,
    paymentProvider: doc.paymentProvider,
    paymentGatewayStatus: doc.paymentGatewayStatus ?? "",
    paymentGatewayResponse: doc.paymentGatewayResponse ?? "",
    amountTotal: doc.amountTotal,
    amountSubtotal: doc.amountSubtotal,
    discountCode: doc.discountCode ?? "",
    discountAmount: doc.discountAmount ?? 0,
    shippingFee: doc.shippingFee,
    transactionFee: doc.transactionFee ?? 0,
    currency: doc.currency,
    status: doc.status,
    deliveryStatus: doc.deliveryStatus ?? "Pending",
    trackingNumber: doc.trackingNumber ?? "",
    trackingUrl: doc.trackingUrl ?? "",
    adminUpdate: doc.adminUpdate ?? "",
    paidAt: doc.paidAt ?? null,
    shippingAddress: {
      fullName: doc.shippingAddress.fullName,
      email: doc.shippingAddress.email,
      phone: doc.shippingAddress.phone,
      addressLine: doc.shippingAddress.addressLine,
    },
    items: doc.items.map((item) => ({
      productId: String(item.productId),
      productName: item.productNameSnapshot,
      image: productImageMap.get(String(item.productId)) ?? "",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice * item.quantity,
      variant: {
        size: item.variant?.size ?? "",
        colorName: item.variant?.color?.name ?? "",
        colorCode: item.variant?.color?.code ?? "#9CA3AF",
        sku: item.variant?.sku ?? "",
      },
    })),
    createdAt: doc.createdAt,
  }));
}

export async function hasSuccessfulPurchaseForProduct(userId: string, productSlug: string) {
  if (!Types.ObjectId.isValid(userId)) {
    return false;
  }

  await connectToDatabase();

  const product = await ProductModel.findOne({ slug: productSlug.toLowerCase() }).select({ _id: 1 }).lean();
  if (!product?._id) {
    return false;
  }

  const order = await OrderModel.findOne({
    userId: new Types.ObjectId(userId),
    status: "Success",
    "items.productId": product._id,
  })
    .select({ _id: 1 })
    .lean();

  return Boolean(order?._id);
}
