import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ProductDetailClient } from "@/components/store/product-detail-client";
import { ProductGrid } from "@/components/store/product-grid";
import { buttonVariants } from "@/components/ui/button";
import { getProductBySlug, listProducts } from "@/lib/services/product-service";
import { cn } from "@/lib/utils";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, allProducts] = await Promise.all([
    getProductBySlug(slug),
    listProducts({ activeOnly: true, sort: "latest" }),
  ]);

  if (!product) {
    notFound();
  }

  const recommendations = allProducts
    .filter((entry) => entry.slug !== product.slug)
    .sort((a, b) => {
      const aScore = a.category === product.category ? 1 : 0;
      const bScore = b.category === product.category ? 1 : 0;
      return bScore - aScore;
    })
    .slice(0, 4)
    .map((entry) => ({
      slug: entry.slug,
      name: entry.name,
      category: entry.category,
      image: entry.image,
      price: entry.basePrice,
      sizes: [...new Set(entry.variants.map((variant) => variant.size))],
    }));

  return (
    <div className="space-y-6">
      <Link href="/products" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}>
        <ArrowLeft className="size-4" />
        Back to shop
      </Link>

      <ProductDetailClient product={product} />

      <section className="rounded-2xl border border-black/10 bg-white/85 p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">You May Also Like</h2>
          <Link
            href="/products"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            Browse all
          </Link>
        </div>
        {recommendations.length > 0 ? (
          <ProductGrid products={recommendations} />
        ) : (
          <p className="text-sm text-muted-foreground">More styles are coming soon.</p>
        )}
      </section>
    </div>
  );
}
