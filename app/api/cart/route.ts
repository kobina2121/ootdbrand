import { NextResponse } from "next/server";

import { failure, success } from "@/lib/api-response";
import { calculateCartTotals } from "@/lib/products";
import { resolveOrderItemsFromCart } from "@/lib/services/product-service";
import { cartPayloadSchema } from "@/lib/validators/cart";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = cartPayloadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(failure("Invalid cart payload"), { status: 400 });
    }

    const totals = calculateCartTotals(parsed.data.items);

    try {
      await resolveOrderItemsFromCart(parsed.data.items);
    } catch (error) {
      if (error instanceof Error && error.message) {
        return NextResponse.json(failure(error.message), { status: 409 });
      }

      return NextResponse.json(failure("One or more items are unavailable or out of stock"), { status: 409 });
    }

    return NextResponse.json(
      success("Cart synced", {
        itemsCount: parsed.data.items.length,
        totals,
      }),
    );
  } catch {
    return NextResponse.json(failure("Could not sync cart"), { status: 500 });
  }
}
