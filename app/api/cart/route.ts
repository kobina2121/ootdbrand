import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/guards";
import { failure, success } from "@/lib/api-response";
import { calculateComboDiscount, pairComboItems } from "@/lib/combo";
import { calculateCartTotals } from "@/lib/products";
import { resolveBestDiscount } from "@/lib/discounts";
import { checkRateLimit } from "@/lib/security/guards";
import { resolveOrderItemsFromCart, type ResolvedOrderItem } from "@/lib/services/product-service";
import { cartPayloadSchema } from "@/lib/validators/cart";

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(request, {
      bucket: "cart:sync",
      limit: 60,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.ok) {
      return NextResponse.json(failure("Too many cart sync requests. Please wait and try again."), {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      });
    }

    const session = await getCurrentSession();
    if (session?.user?.role === "admin") {
      return NextResponse.json(failure("Admin accounts cannot use cart checkout flows."), { status: 403 });
    }

    const json = await request.json();
    const parsed = cartPayloadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(failure("Invalid cart payload"), { status: 400 });
    }

    let resolvedItems: ResolvedOrderItem[];

    try {
      resolvedItems = await resolveOrderItemsFromCart(parsed.data.items);
    } catch (error) {
      if (error instanceof Error && error.message) {
        return NextResponse.json(failure(error.message), { status: 409 });
      }

      return NextResponse.json(failure("One or more items are unavailable or out of stock"), { status: 409 });
    }

    const discount = resolveBestDiscount(
      parsed.data.items,
      parsed.data.discountCode,
      calculateComboDiscount(resolvedItems),
    );
    const totals = calculateCartTotals(parsed.data.items, discount.amount);

    return NextResponse.json(
      success("Cart synced", {
        itemsCount: parsed.data.items.length,
        totals,
        discount: {
          ...discount,
          comboPairs: pairComboItems(
            resolvedItems.map((item) => ({ sku: item.variant.sku, category: item.category, quantity: item.quantity })),
          ),
        },
      }),
    );
  } catch {
    return NextResponse.json(failure("Could not sync cart"), { status: 500 });
  }
}
