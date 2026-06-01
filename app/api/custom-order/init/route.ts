import { NextResponse } from "next/server";

import { failure, success } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { initializePaystackTransaction } from "@/lib/paystack/client";
import {
  createPendingCustomOrder,
  failPendingCustomOrderByReference,
} from "@/lib/services/custom-order-service";
import { notifyAdminNewOrder } from "@/lib/services/admin-alert-service";
import { customOrderInitSchema } from "@/lib/validators/custom-order";

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
    const json = await request.json();
    const parsed = customOrderInitSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(failure("Invalid custom order payload"), { status: 400 });
    }

    const { paymentMethod, ...customOrderPayload } = parsed.data;
    const session = await requireAuthenticatedUser();
    const customOrder = await createPendingCustomOrder(
      customOrderPayload,
      session?.user
        ? {
            id: session.user.id,
            name: session.user.name ?? "Customer",
            email: session.user.email ?? customOrderPayload.email,
            role: session.user.role,
          }
        : null,
    );
    createdReference = customOrder.paymentReference;

    const baseUrl = resolveAppBaseUrl(request);
    const callbackUrl = `${baseUrl}/checkout/success?reference=${encodeURIComponent(customOrder.paymentReference)}`;
    const cancelUrl = `${baseUrl}/checkout/failed?reference=${encodeURIComponent(customOrder.paymentReference)}`;

    const paystackInit = await initializePaystackTransaction({
      email: parsed.data.email,
      amountSubunit: customOrder.amountTotal * 100,
      reference: customOrder.paymentReference,
      callbackUrl,
      cancelUrl,
      channels: [paymentMethod],
      metadata: {
        customOrderId: customOrder.id,
        orderType: "custom",
        paymentMethod,
        productSlug: customOrderPayload.productSlug,
        variantSku: customOrderPayload.variantSku,
      },
    });

    if (!paystackInit.status || !paystackInit.data.authorization_url) {
      await failPendingCustomOrderByReference(
        customOrder.paymentReference,
        paystackInit.message || "paystack initialization failed",
      );
      return NextResponse.json(failure(paystackInit.message || "Could not initialize custom order payment"), {
        status: 502,
      });
    }

    await notifyAdminNewOrder({
      orderType: "custom-order",
      reference: customOrder.paymentReference,
      customerName: customOrderPayload.fullName,
      customerEmail: customOrderPayload.email,
      customerPhone: customOrderPayload.phone,
      amount: customOrder.amountTotal,
      createdAt: customOrder.createdAt ?? new Date(),
    }).catch(() => null);

    return NextResponse.json(
      success("Custom order payment initialized", {
        customOrderId: customOrder.id,
        reference: customOrder.paymentReference,
        amount: customOrder.amountTotal,
        currency: customOrder.currency,
        authorizationUrl: paystackInit.data.authorization_url,
      }),
    );
  } catch (error) {
    if (createdReference && error instanceof Error) {
      await failPendingCustomOrderByReference(createdReference, error.message).catch(() => null);
    }

    if (error instanceof Error && error.message.includes("PAYSTACK_SECRET_KEY")) {
      return NextResponse.json(failure("Payment gateway is not configured"), { status: 500 });
    }

    if (error instanceof Error && error.message.includes("timed out")) {
      return NextResponse.json(failure("Could not initialize payment in time. Please retry."), { status: 504 });
    }

    if (
      error instanceof Error &&
      (error.message === "Selected product was not found." || error.message === "Selected product option was not found.")
    ) {
      return NextResponse.json(failure(error.message), { status: 404 });
    }

    if (error instanceof Error && error.message.toLowerCase().includes("paystack")) {
      return NextResponse.json(failure(error.message), { status: 502 });
    }

    return NextResponse.json(failure("Could not initialize custom order payment"), { status: 500 });
  }
}
