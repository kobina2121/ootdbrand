import { NextResponse } from "next/server";

import { failure, success } from "@/lib/api-response";
import { listProducts } from "@/lib/services/product-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category")?.trim() ?? "";
    const exclude = searchParams
      .get("exclude")
      ?.split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean) ?? [];
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "6", 10);
    const limit = Number.isFinite(limitParam) ? Math.min(12, Math.max(1, limitParam)) : 6;

    const products = await listProducts({
      activeOnly: true,
      category: category || "all",
      sort: "latest",
    });

    const filtered = products
      .filter((product) => !exclude.includes(product.slug.toLowerCase()))
      .slice(0, limit)
      .map((product) => ({
        slug: product.slug,
        name: product.name,
        category: product.category,
        image: product.image,
        price: product.basePrice,
        sizes: [...new Set(product.variants.map((variant) => variant.size))],
        rating: product.rating,
        reviewCount: product.reviewCount,
      }));

    return NextResponse.json(success("Products fetched", { products: filtered }));
  } catch {
    return NextResponse.json(failure("Could not fetch products"), { status: 500 });
  }
}
