import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/mongoose";
import { ProductReviewModel } from "@/lib/db/models/product-review";

export type PublicProductReview = {
  id: string;
  productSlug: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

function toPublicReview(
  doc:
    | {
        _id: Types.ObjectId;
        productSlug: string;
        userName: string;
        rating: number;
        comment: string;
        createdAt: Date;
      }
    | null,
): PublicProductReview | null {
  if (!doc) {
    return null;
  }

  return {
    id: String(doc._id),
    productSlug: doc.productSlug,
    userName: doc.userName,
    rating: doc.rating,
    comment: doc.comment,
    createdAt: doc.createdAt,
  };
}

export async function listReviewsByProductSlug(productSlug: string, limit = 20) {
  await connectToDatabase();

  const reviews = await ProductReviewModel.find({
    productSlug: productSlug.toLowerCase(),
    isApproved: true,
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(50, Math.max(1, limit)))
    .lean();

  return reviews
    .map((review) =>
      toPublicReview({
        _id: review._id as Types.ObjectId,
        productSlug: review.productSlug,
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      }),
    )
    .filter((review): review is PublicProductReview => review !== null);
}

export async function createProductReview(input: {
  productSlug: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
}) {
  await connectToDatabase();

  const created = await ProductReviewModel.create({
    productSlug: input.productSlug.toLowerCase(),
    userId: input.userId,
    userName: input.userName,
    rating: input.rating,
    comment: input.comment.trim(),
    isApproved: true,
  });

  return toPublicReview({
    _id: created._id as Types.ObjectId,
    productSlug: created.productSlug,
    userName: created.userName,
    rating: created.rating,
    comment: created.comment,
    createdAt: created.createdAt,
  });
}

