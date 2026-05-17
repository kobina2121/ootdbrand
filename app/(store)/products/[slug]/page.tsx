import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ProductDetailClient } from "@/components/store/product-detail-client";
import { buttonVariants } from "@/components/ui/button";
import { getProductBySlug } from "@/lib/services/product-service";
import { cn } from "@/lib/utils";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link href="/products" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}>
        <ArrowLeft className="size-4" />
        Back to shop
      </Link>

      <ProductDetailClient product={product} />
    </div>
  );
}
