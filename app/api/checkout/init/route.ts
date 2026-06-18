import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { failure, success } from "@/lib/api-response";
import { initializePaystackTransaction } from "@/lib/paystack/client";
import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { createPendingOrder, failPendingOrderByReference } from "@/lib/services/order-service";
import { notifyAdminNewOrder } from "@/lib/services/admin-alert-service";
import { checkoutInitSchema } from "@/lib/validators/checkout";

function resolveAppBaseUrl(request: Request) {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;

  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const url = new URL(request.url);
  return url.origin;
}

export async function POST(request: Request) {
  let createdReference: string | null = null;

  try {
    if (!isTrustedOrigin(request)) {
      return NextResponse.json(failure("Invalid request origin."), { status: 403 });
    }

    if (!isJsonRequest(request)) {
      return NextResponse.json(failure("Unsupported content type."), { status: 415 });
    }

    const rateLimit = checkRateLimit(request, {
      bucket: "checkout:init",
      limit: 12,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.ok) {
      return NextResponse.json(failure("Too many checkout attempts. Please wait and try again."), {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      });
    }

    const json = await request.json();
    const parsed = checkoutInitSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(failure("Invalid checkout payload"), { status: 400 });
    }

    const { paymentMethod, ...orderPayload } = parsed.data;
    const session = await requireAuthenticatedUser();
    if (session?.user?.role === "admin") {
      return NextResponse.json(failure("Admin accounts cannot place store orders."), { status: 403 });
    }

    const order = await createPendingOrder(
      orderPayload,
      session?.user
        ? {
            id: session.user.id,
            name: session.user.name ?? "Guest",
            email: session.user.email ?? orderPayload.email,
            role: session.user.role,
          }
        : null,
    );
    createdReference = order.paymentReference;

    const baseUrl = resolveAppBaseUrl(request);
    const callbackUrl = `${baseUrl}/checkout/success?reference=${encodeURIComponent(order.paymentReference)}`;
    const cancelUrl = `${baseUrl}/checkout/failed?reference=${encodeURIComponent(order.paymentReference)}`;

    const paystackInit = await initializePaystackTransaction({
      email: parsed.data.email,
      amountSubunit: order.amountTotal * 100,
      reference: order.paymentReference,
      callbackUrl,
      cancelUrl,
      channels: [paymentMethod],
      metadata: {
        orderId: order.id,
        paymentMethod,
      },
    });

    if (!paystackInit.status || !paystackInit.data.authorization_url) {
      await failPendingOrderByReference(order.paymentReference, paystackInit.message || "paystack initialization failed");
      return NextResponse.json(failure(paystackInit.message || "Could not initialize Paystack checkout"), { status: 502 });
    }

    await notifyAdminNewOrder({
      orderType: "store-order",
      reference: order.paymentReference,
      customerName: orderPayload.fullName,
      customerEmail: orderPayload.email,
      customerPhone: orderPayload.phone,
      amount: order.amountTotal,
      createdAt: order.createdAt ?? new Date(),
    }).catch(() => null);

    return NextResponse.json(
      success("Checkout initialized", {
        orderId: order.id,
        reference: order.paymentReference,
        amount: order.amountTotal,
        currency: order.currency,
        authorizationUrl: paystackInit.data.authorization_url,
      }),
    );
  } catch (error) {
    if (createdReference && error instanceof Error) {
      await failPendingOrderByReference(createdReference, error.message).catch(() => null);
    }

    if (error instanceof Error) {
      if (error.message.toLowerCase().includes("coupon")) {
        return NextResponse.json(failure(error.message), { status: 400 });
      }

      if (error.message.startsWith("Variant not found") || error.message.startsWith("Insufficient stock")) {
        return NextResponse.json(failure(error.message), { status: 409 });
      }

      if (error.message.includes("PAYSTACK_SECRET_KEY")) {
        return NextResponse.json(failure("Payment gateway is not configured"), { status: 500 });
      }

      if (error.message.includes("timed out")) {
        return NextResponse.json(failure("Could not initialize payment in time. Please retry."), { status: 504 });
      }

      if (error.message.toLowerCase().includes("paystack")) {
        return NextResponse.json(failure(error.message), { status: 502 });
      }
    }

    return NextResponse.json(failure("Could not initialize checkout"), { status: 500 });
  }
}
