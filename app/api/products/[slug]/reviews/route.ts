import { NextResponse } from "next/server";

import { failure, success } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { hasSuccessfulPurchaseForProduct } from "@/lib/services/order-service";
import { createProductReview, listReviewsByProductSlug } from "@/lib/services/review-service";
import { productReviewPayloadSchema } from "@/lib/validators/review";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { slug } = await context.params;

  try {
    const reviews = await listReviewsByProductSlug(slug);
    return NextResponse.json(success("Reviews fetched", { reviews }));
  } catch {
    return NextResponse.json(failure("Could not fetch reviews"), { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireAuthenticatedUser();

  if (!session?.user?.id) {
    return NextResponse.json(failure("Please login to leave a review"), { status: 401 });
  }

  const { slug } = await context.params;
  const hasPurchased = await hasSuccessfulPurchaseForProduct(session.user.id, slug);

  if (!hasPurchased) {
    return NextResponse.json(failure("You can only leave a review after purchasing this product."), { status: 403 });
  }

  try {
    const json = await request.json();
    const parsed = productReviewPayloadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(failure("Invalid review payload"), { status: 400 });
    }

    const userName = session.user.name?.trim() || session.user.email?.trim() || "Customer";
    const review = await createProductReview({
      productSlug: slug,
      userId: session.user.id,
      userName,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });

    if (!review) {
      return NextResponse.json(failure("Could not save review"), { status: 500 });
    }

    return NextResponse.json(success("Review submitted", { review }), { status: 201 });
  } catch {
    return NextResponse.json(failure("Could not save review"), { status: 500 });
  }
}
