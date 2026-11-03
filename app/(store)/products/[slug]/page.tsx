import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ProductDetailClient } from "@/components/store/product-detail-client";
import { ProductGrid } from "@/components/store/product-grid";
import { SectionHeading } from "@/components/store/section-heading";
import { ProductReviews } from "@/components/store/product-reviews";
import { getCurrentSession } from "@/lib/auth/guards";
import { hasSuccessfulPurchaseForProduct } from "@/lib/services/order-service";
import { listReviewsByProductSlug } from "@/lib/services/review-service";
import { encodeProductSlugForPath } from "@/lib/product-slug";
import { getProductBySlug, listProducts } from "@/lib/services/product-service";
import { absoluteUrl, searchLogoPath, siteName } from "@/lib/site-metadata";

type ProductDetailPageProps = {
 params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
 const { slug } = await params;
 const product = await getProductBySlug(slug);

 if (!product) {
 return {
 title: "Product Not Found",
 robots: {
 index: false,
 follow: false,
 },
 };
 }

 const productPath = `/products/${encodeProductSlugForPath(product.slug)}`;
 const title = product.name;
 const description =
 product.description ||
 `Shop ${product.name}, a premium ${product.category.toLowerCase()} from ${siteName}.`;
 const image = product.image || searchLogoPath;

 return {
 title,
 description,
 alternates: {
 canonical: productPath,
 },
 openGraph: {
 title: `${product.name} | ${siteName}`,
 description,
 type: "website",
 url: absoluteUrl(productPath),
 images: [
 {
 url: image,
 alt: product.name,
 },
 ],
 },
 twitter: {
 card: "summary_large_image",
 title,
 description,
 images: [image],
 },
 };
}

export default async function ProductDetailPage({
 params,
}: ProductDetailPageProps) {
 const { slug } = await params;
 const [product, allProducts, session, productReviews] = await Promise.all([
 getProductBySlug(slug),
 listProducts({ activeOnly: true, sort: "latest" }),
 getCurrentSession(),
 listReviewsByProductSlug(slug, 30),
 ]);

 if (!product) {
 notFound();
 }

 const canReview = session?.user?.id
 ? await hasSuccessfulPurchaseForProduct(session.user.id, product.slug)
 : false;
 const reviewEligibility = session?.user?.id
 ? canReview
 ? "can_review"
 : "purchase_required"
 : "login_required";

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
	 variants: entry.variants.map((variant) => ({
	 name: variant.name,
	 size: variant.size,
	 color: variant.color,
	 colorCode: variant.colorCode,
	 image: variant.image,
	 sku: variant.sku,
	 stock: variant.stock,
	 priceOverride: variant.priceOverride,
	 })),
	 rating: entry.rating,
	 reviewCount: entry.reviewCount,
	 }));

 return (
 <div className="space-y-12 sm:space-y-20">
 <div className="space-y-3">
 <Link href="/products" className="inline-flex min-h-11 items-center gap-2 text-xs tracking-[0.22em] text-[#1d1b1a] uppercase underline-offset-4 hover:underline">
 <ArrowLeft className="size-4" />
 Back to shop
 </Link>

 <ProductDetailClient product={product} />
 </div>

 <ProductReviews
 productSlug={product.slug}
 reviewEligibility={reviewEligibility}
 reviews={productReviews.map((review) => ({
 id: review.id,
 productSlug: review.productSlug,
 userName: review.userName,
 rating: review.rating,
 comment: review.comment,
 createdAt: review.createdAt.toISOString(),
 }))}
 />

 <section className="space-y-8 sm:space-y-12">
 <SectionHeading title="You May Also Like" href="/products" linkLabel="Browse all" />
 {recommendations.length > 0 ? (
 <ProductGrid products={recommendations} className="lg:grid-cols-4" />
 ) : (
 <p className="text-sm text-muted-foreground">More styles are coming soon.</p>
 )}
 </section>
 </div>
 );
}
