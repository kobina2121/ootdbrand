"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type ProductReviewView = {
  id: string;
  productSlug: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type ProductReviewsProps = {
  productSlug: string;
  reviews: ProductReviewView[];
  canReview: boolean;
};

function renderStars(rating: number) {
  return "★★★★★".slice(0, rating) + "☆☆☆☆☆".slice(0, 5 - rating);
}

export function ProductReviews({ productSlug, reviews: initialReviews, canReview }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ProductReviewView[]>(initialReviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return 0;
    }

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedComment = comment.trim();
    if (trimmedComment.length < 5) {
      toast.error("Please write a short review (at least 5 characters).");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/products/${productSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: trimmedComment,
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        message: string;
        data?: { review?: ProductReviewView };
      };

      if (!response.ok || !json.ok || !json.data?.review) {
        toast.error(json.message || "Could not submit review.");
        return;
      }

      const createdReview = json.data.review;
      setReviews((previous) => [createdReview, ...previous]);
      setComment("");
      setRating(5);
      toast.success("Review submitted.");
    } catch {
      toast.error("Could not submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-black/10 bg-white/85 p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Customer Reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {reviews.length > 0
              ? `${averageRating.toFixed(1)} / 5 from ${reviews.length} review${reviews.length > 1 ? "s" : ""}`
              : "No reviews yet. Be the first to share your thoughts."}
          </p>
        </div>
      </div>

      {canReview ? (
        <Card className="border-black/10 bg-[#faf9f7]">
          <CardHeader>
            <CardTitle className="text-lg">Leave a Review</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={(event) => void submitReview(event)}>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((entry) => (
                  <Button
                    key={entry}
                    type="button"
                    variant={rating === entry ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setRating(entry)}
                  >
                    {renderStars(entry)}
                  </Button>
                ))}
              </div>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Tell us about quality, fit, and how it feels."
                rows={4}
              />
              <Button type="submit" disabled={isSubmitting} className="rounded-full">
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href={`/login?next=/products/${encodeURIComponent(productSlug)}`} className="underline underline-offset-4">
            Login
          </Link>{" "}
          to leave a review.
        </p>
      )}

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{review.userName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
              <p className="mt-1 text-sm tracking-wide text-[#a47531]">{renderStars(review.rating)}</p>
              <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
