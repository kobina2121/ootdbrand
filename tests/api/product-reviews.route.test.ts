import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { hasSuccessfulPurchaseForProduct } from "@/lib/services/order-service";
import { createProductReview, listReviewsByProductSlug } from "@/lib/services/review-service";

vi.mock("@/lib/auth/guards", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/services/review-service", () => ({
  createProductReview: vi.fn(),
  listReviewsByProductSlug: vi.fn(),
}));

vi.mock("@/lib/services/order-service", () => ({
  hasSuccessfulPurchaseForProduct: vi.fn(),
}));

import { GET, POST } from "@/app/api/products/[slug]/reviews/route";

const mockRequireAuthenticatedUser = vi.mocked(requireAuthenticatedUser);
const mockCreateProductReview = vi.mocked(createProductReview);
const mockListReviewsByProductSlug = vi.mocked(listReviewsByProductSlug);
const mockHasSuccessfulPurchaseForProduct = vi.mocked(hasSuccessfulPurchaseForProduct);

describe("Product reviews route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns reviews for a product slug", async () => {
    mockListReviewsByProductSlug.mockResolvedValue([
      {
        id: "review-1",
        productSlug: "arc-hoodie",
        userName: "Ama",
        rating: 5,
        comment: "Great quality and fit.",
        createdAt: new Date("2026-05-20T10:00:00.000Z"),
      },
    ]);

    const response = await GET(new Request("http://localhost:3000/api/products/arc-hoodie/reviews"), {
      params: Promise.resolve({ slug: "arc-hoodie" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      message: "Reviews fetched",
    });
    expect(body.data.reviews).toHaveLength(1);
    expect(mockListReviewsByProductSlug).toHaveBeenCalledWith("arc-hoodie");
  });

  it("requires authentication to post a review", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue(null);

    const request = new Request("http://localhost:3000/api/products/arc-hoodie/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rating: 5, comment: "Amazing product!" }),
    });

    const response = await POST(request, { params: Promise.resolve({ slug: "arc-hoodie" }) });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      ok: false,
      message: "Please login to leave a review",
    });
  });

  it("validates review payload on post", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      user: { id: "user-1", name: "Ama", email: "ama@example.com", role: "customer" },
    } as never);
    mockHasSuccessfulPurchaseForProduct.mockResolvedValue(true);

    const request = new Request("http://localhost:3000/api/products/arc-hoodie/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rating: 0, comment: "bad" }),
    });

    const response = await POST(request, { params: Promise.resolve({ slug: "arc-hoodie" }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      message: "Invalid review payload",
    });
    expect(mockCreateProductReview).not.toHaveBeenCalled();
  });

  it("requires a successful purchase to post a review", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      user: { id: "user-1", name: "Ama", email: "ama@example.com", role: "customer" },
    } as never);
    mockHasSuccessfulPurchaseForProduct.mockResolvedValue(false);

    const request = new Request("http://localhost:3000/api/products/arc-hoodie/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rating: 5, comment: "Amazing product!" }),
    });

    const response = await POST(request, { params: Promise.resolve({ slug: "arc-hoodie" }) });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      ok: false,
      message: "You can only leave a review after purchasing this product.",
    });
    expect(mockCreateProductReview).not.toHaveBeenCalled();
  });

  it("creates review for authenticated user", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      user: { id: "user-1", name: "Ama", email: "ama@example.com", role: "customer" },
    } as never);
    mockHasSuccessfulPurchaseForProduct.mockResolvedValue(true);
    mockCreateProductReview.mockResolvedValue({
      id: "review-2",
      productSlug: "arc-hoodie",
      userName: "Ama",
      rating: 4,
      comment: "Lovely feel and silhouette.",
      createdAt: new Date("2026-05-20T10:00:00.000Z"),
    });

    const request = new Request("http://localhost:3000/api/products/arc-hoodie/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rating: 4, comment: "Lovely feel and silhouette." }),
    });

    const response = await POST(request, { params: Promise.resolve({ slug: "arc-hoodie" }) });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      ok: true,
      message: "Review submitted",
      data: {
        review: {
          id: "review-2",
          productSlug: "arc-hoodie",
        },
      },
    });
    expect(mockCreateProductReview).toHaveBeenCalledWith({
      productSlug: "arc-hoodie",
      userId: "user-1",
      userName: "Ama",
      rating: 4,
      comment: "Lovely feel and silhouette.",
    });
  });
});
