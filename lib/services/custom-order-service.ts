import { randomUUID } from "node:crypto";

import { Types } from "mongoose";

import {
  calculateCustomOrderTotal,
  resolveCustomOrderCustomizationFeeGhs,
  resolveTransactionFeeGhs,
} from "@/lib/custom-order-pricing";
import { CustomOrderModel } from "@/lib/db/models/custom-order";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ProductModel } from "@/lib/db/models/product";
import type { AppUser } from "@/lib/services/user-service";

export type CreatePendingCustomOrderInput = {
  productSlug: string;
  fullName: string;
  email: string;
  phone: string;
  type?: string;
  preferredSize: string;
  preferredColor: string;
  bustSize: string;
  waistSize: string;
  hipSize: string;
  additionalMeasurements?: string;
  notes?: string;
  referenceImage?: string;
  deliveryAddress: {
    addressLine: string;
    city: string;
    stateRegion: string;
    country: string;
  };
};

export type CustomOrderVerificationPayload = {
  status: string;
  amountSubunit: number;
  currency: string;
  paidAt?: string | null;
  gatewayResponse?: string;
};

export type CustomOrderReconcileResult = {
  customOrderId: string;
  status: "Pending" | "Success" | "Failed";
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

export async function createPendingCustomOrder(input: CreatePendingCustomOrderInput, user?: AppUser | null) {
  await connectToDatabase();

  const paymentReference = `CUS-${randomUUID().slice(0, 10).toUpperCase()}`;
  const product = await ProductModel.findOne({ slug: input.productSlug.toLowerCase(), isActive: true }).lean();

  if (!product) {
    throw new Error("Selected product was not found.");
  }

  const leadVariant = product.variants[0];
  const baseUnitPrice = product.basePrice;
  const customizationCharge = resolveCustomOrderCustomizationFeeGhs();
  const transactionFee = resolveTransactionFeeGhs();
  const amountTotal = calculateCustomOrderTotal(baseUnitPrice, customizationCharge, transactionFee);
  const normalizedPreferredSize = input.preferredSize.trim();
  const normalizedPreferredColor = input.preferredColor.trim();
  const measurementSummary = [
    `Bust: ${input.bustSize.trim()}`,
    `Waist: ${input.waistSize.trim()}`,
    `Hip: ${input.hipSize.trim()}`,
    input.additionalMeasurements?.trim() ? `Additional: ${input.additionalMeasurements.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
  const variantSkuSnapshot = leadVariant?.sku ?? `CUSTOM-${product.slug.toUpperCase()}`;
  const productImageSnapshot = leadVariant?.image ?? product.images?.[0] ?? "";

  const customOrder = await CustomOrderModel.create({
    userId: user && Types.ObjectId.isValid(user.id) ? new Types.ObjectId(user.id) : undefined,
    productId: product._id,
    productSlug: product.slug,
    productNameSnapshot: product.name,
    productImageSnapshot,
    variantSkuSnapshot,
    variantUnitPriceSnapshot: baseUnitPrice,
    baseProductPriceSnapshot: baseUnitPrice,
    customizationChargeSnapshot: customizationCharge,
    transactionFeeSnapshot: transactionFee,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    type: input.type || undefined,
    category: product.category,
    size: normalizedPreferredSize,
    color: normalizedPreferredColor,
    measurements: measurementSummary,
    bustSize: input.bustSize.trim(),
    waistSize: input.waistSize.trim(),
    hipSize: input.hipSize.trim(),
    additionalMeasurements: input.additionalMeasurements?.trim() || undefined,
    notes: input.notes || undefined,
    referenceImage: input.referenceImage || undefined,
    deliveryAddress: input.deliveryAddress,
    amountTotal,
    currency: "GHS",
    status: "Pending",
    deliveryStatus: "Pending",
    paymentProvider: "paystack",
    paymentReference,
  });

  return {
    id: String(customOrder._id),
    paymentReference,
    baseUnitPrice,
    customizationCharge,
    transactionFee,
    amountTotal,
    currency: customOrder.currency,
    status: customOrder.status,
    createdAt: customOrder.createdAt,
  };
}

export async function reconcileCustomOrderAfterVerification(
  reference: string,
  verification: CustomOrderVerificationPayload,
): Promise<CustomOrderReconcileResult | null> {
  await connectToDatabase();

  const customOrder = await CustomOrderModel.findOne({ paymentReference: reference }).lean();

  if (!customOrder) {
    return null;
  }

  if (customOrder.status === "Success") {
    return {
      customOrderId: String(customOrder._id),
      status: "Success",
      changed: false,
      reason: "already-success",
    };
  }

  const expectedAmountSubunit = Math.round(customOrder.amountTotal * 100);
  const sameCurrency = customOrder.currency.toUpperCase() === verification.currency.toUpperCase();
  const sameAmount = expectedAmountSubunit === Math.round(verification.amountSubunit);
  const isGatewaySuccess = verification.status.toLowerCase() === "success";

  if (isGatewaySuccess && sameCurrency && sameAmount) {
    const paidAt = toValidDate(verification.paidAt);

    const update = await CustomOrderModel.findOneAndUpdate(
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
      customOrderId: String(customOrder._id),
      status: update?.status ?? customOrder.status,
      changed: Boolean(update),
      reason: "verified-success",
    };
  }

  const reason = !isGatewaySuccess
    ? "verification-failed"
    : !sameCurrency
      ? "currency-mismatch"
      : "amount-mismatch";

  const failed = await CustomOrderModel.findOneAndUpdate(
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
    customOrderId: String(customOrder._id),
    status: failed?.status ?? customOrder.status,
    changed: Boolean(failed),
    reason,
  };
}

export async function failPendingCustomOrderByReference(reference: string, reason = "checkout initialization failed") {
  await connectToDatabase();

  const failed = await CustomOrderModel.findOneAndUpdate(
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

export async function listCustomOrders(filters: { status?: "Pending" | "Success" | "Failed"; limit?: number } = {}) {
  try {
    await connectToDatabase();

    const query: { status?: "Pending" | "Success" | "Failed" } = {};
    if (filters.status) {
      query.status = filters.status;
    }

    const docs = await CustomOrderModel.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit ?? 100)
      .lean();

    return docs.map((doc) => ({
      id: String(doc._id),
      productSlug: doc.productSlug,
      productName: doc.productNameSnapshot,
      productImage: doc.productImageSnapshot ?? "",
      variantSku: doc.variantSkuSnapshot,
      variantUnitPrice: doc.variantUnitPriceSnapshot,
      baseUnitPrice: doc.baseProductPriceSnapshot,
      customizationCharge: doc.customizationChargeSnapshot ?? 0,
      transactionFee: doc.transactionFeeSnapshot ?? 0,
      paymentReference: doc.paymentReference,
      fullName: doc.fullName,
      email: doc.email,
      phone: doc.phone,
      type: doc.type ?? "",
      category: doc.category,
      size: doc.size,
      color: doc.color,
      amountTotal: doc.amountTotal,
      paymentProvider: doc.paymentProvider,
      deliveryStatus: doc.deliveryStatus ?? "Pending",
      trackingNumber: doc.trackingNumber ?? "",
      trackingUrl: doc.trackingUrl ?? "",
      adminUpdate: doc.adminUpdate ?? "",
      measurements: doc.measurements,
      bustSize: doc.bustSize ?? "",
      waistSize: doc.waistSize ?? "",
      hipSize: doc.hipSize ?? "",
      additionalMeasurements: doc.additionalMeasurements ?? "",
      notes: doc.notes ?? "",
      referenceImage: doc.referenceImage ?? "",
      paymentGatewayStatus: doc.paymentGatewayStatus ?? "",
      paymentGatewayResponse: doc.paymentGatewayResponse ?? "",
      paidAt: doc.paidAt ?? null,
      deliveryAddress: {
        addressLine: doc.deliveryAddress.addressLine,
        city: doc.deliveryAddress.city,
        stateRegion: doc.deliveryAddress.stateRegion,
        country: doc.deliveryAddress.country,
      },
      status: doc.status,
      createdAt: doc.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function getCustomOrdersByUserId(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    return [];
  }

  await connectToDatabase();
  const docs = await CustomOrderModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).lean();

  return docs.map((doc) => ({
    id: String(doc._id),
    paymentReference: doc.paymentReference,
    productSlug: doc.productSlug,
    productName: doc.productNameSnapshot,
    productImage: doc.productImageSnapshot ?? "",
    variantSku: doc.variantSkuSnapshot,
    variantUnitPrice: doc.variantUnitPriceSnapshot,
    baseUnitPrice: doc.baseProductPriceSnapshot,
    customizationCharge: doc.customizationChargeSnapshot ?? 0,
    transactionFee: doc.transactionFeeSnapshot ?? 0,
    amountTotal: doc.amountTotal,
    currency: doc.currency,
    status: doc.status,
    paymentProvider: doc.paymentProvider,
    deliveryStatus: doc.deliveryStatus ?? "Pending",
    trackingNumber: doc.trackingNumber ?? "",
    trackingUrl: doc.trackingUrl ?? "",
    adminUpdate: doc.adminUpdate ?? "",
    type: doc.type ?? "",
    category: doc.category,
    size: doc.size,
    color: doc.color,
    measurements: doc.measurements,
    bustSize: doc.bustSize ?? "",
    waistSize: doc.waistSize ?? "",
    hipSize: doc.hipSize ?? "",
    additionalMeasurements: doc.additionalMeasurements ?? "",
    notes: doc.notes ?? "",
    referenceImage: doc.referenceImage ?? "",
    paymentGatewayStatus: doc.paymentGatewayStatus ?? "",
    paymentGatewayResponse: doc.paymentGatewayResponse ?? "",
    paidAt: doc.paidAt ?? null,
    deliveryAddress: {
      addressLine: doc.deliveryAddress.addressLine,
      city: doc.deliveryAddress.city,
      stateRegion: doc.deliveryAddress.stateRegion,
      country: doc.deliveryAddress.country,
    },
    createdAt: doc.createdAt,
  }));
}
