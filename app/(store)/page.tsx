import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FeaturedProductsCarousel } from "@/components/store/featured-products-carousel";
import { HeroImageRotator } from "@/components/store/hero-image-rotator";
import { LazyShowcaseVideo } from "@/components/store/lazy-showcase-video";
import { NewArrivalsEditorial } from "@/components/store/new-arrivals-editorial";
import { SectionHeading } from "@/components/store/section-heading";
import { TopSellingCarousel } from "@/components/store/top-selling-carousel";
import { formatPriceNgn, type Product } from "@/lib/products";
import { listProducts } from "@/lib/services/product-service";

const heroImages = [
 "/images/hero/hero-main.jpg",
 "/images/hero/hero-bench.jpg",
 "/images/hero/hero-walk.jpg",
 "/images/hero/hero-pose.jpg",
] as const;

const categoryHighlights = [
 {
 title: "Look 1",
 image: "/images/top-selling/look-01-red-white-tops.jpg",
 },
 {
 title: "Look 2",
 image: "/images/categories/accessories.jpg",
 },
 {
 title: "Look 3",
 image: "/images/categories/mens.jpg",
 },
 {
 title: "Look 4",
 image: "/images/top-selling/look-04.jpg",
 },
 {
 title: "Look 5",
 image: "/images/top-selling/look-05.jpg",
 },
 {
 title: "Look 6",
 image: "/images/top-selling/look-06.jpg",
 },
 {
 title: "Look 7",
 image: "/images/top-selling/look-07.jpg",
 },
 {
 title: "Look 8",
 image: "/images/top-selling/look-08.jpg",
 },
 {
 title: "Look 9",
 image: "/images/top-selling/look-09.jpg",
 },
 {
 title: "Look 10",
 image: "/images/top-selling/look-10.jpg",
 },
];

const featuredImageBySlug: Record<string, string> = {
 "cloud-tee": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
 "field-jacket": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80",
 "core-chinos": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
 "arc-hoodie": "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=900&q=80",
 "linen-shirt": "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80",
 "studio-shorts": "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80",
};

const brandStats = [
 { value: "200+", label: "Happy Customers" },
 { value: "20+", label: "Sleek Styles" },
 { value: "100%", label: "Premium Materials" },
] as const;

const marqueeItems = [
 "Elevated Womenswear",
 "Made in Ghana",
 "Custom Pieces",
 "48-Hour Returns",
 "Wear Your Story",
] as const;

const editorialShowcase = {
 label: "APPAREL",
 title: "Signature\nDresses",
 description:
 "Elevated silhouettes made to flatter every shape. Step into timeless pieces that carry confidence from day to night.",
 cta: "SHOP COLLECTION",
 video: "/videos/editorial-showcase.mp4",
} as const;

function toCarouselItem(product: Product) {
 return {
 slug: product.slug,
 name: product.name,
 category: product.category,
 variants: product.variants.map((variant) => ({
 name: variant.name,
 size: variant.size,
 color: variant.color,
 colorCode: variant.colorCode,
 image: variant.image,
 sku: variant.sku,
 stock: variant.stock,
 priceOverride: variant.priceOverride,
 })),
	 rating: product.rating,
	 reviewCount: product.reviewCount,
	 price: formatPriceNgn(product.basePrice),
 priceValue: product.basePrice,
 image: product.image || featuredImageBySlug[product.slug] || "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=900&q=80",
 };
}

export default async function HomePage() {
 const catalogProducts = await listProducts({ activeOnly: true, sort: "latest" });
 const newArrivals = catalogProducts.slice(0, 4);
 const featuredCatalogProducts = [...catalogProducts].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 6);

 return (
 <div className="space-y-16 sm:space-y-24">
 <div>
 <section className="full-bleed animate-fade-up relative -mt-5 h-[72svh] min-h-[480px] overflow-hidden bg-[#1d1b1a] sm:-mt-8 sm:h-[80svh] sm:min-h-[560px] lg:h-[calc(100svh-6.5rem)] lg:min-h-[640px]">
 <HeroImageRotator images={heroImages} />
 <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/85" />

 <div className="absolute inset-x-0 bottom-0 z-10 text-white">
 <div className="page-container pb-6 sm:pb-10">
 <p className="mb-3 text-[0.68rem] tracking-[0.35em] text-white/90 uppercase sm:text-xs">New Collection &mdash; Made in Ghana</p>
 <h1 className="font-heading text-[clamp(3.75rem,15vw,8rem)] leading-[0.84] font-medium tracking-[-0.03em] lg:text-[clamp(6rem,10.5vw,11rem)]">
 Wear Your
 <span className="block pl-[0.9em] font-heading italic lg:inline lg:pl-[0.22em]">Story</span>
 </h1>
 <div className="mt-5 flex flex-col gap-4 sm:mt-8 sm:flex-row sm:items-end sm:justify-between">
 <p className="max-w-md text-sm text-white/90 sm:text-base">
 Every stitch speaks confidence, elegance, and the woman you are becoming.
 </p>
 <div className="flex shrink-0 flex-wrap items-center gap-5">
 <Link
 href="/products"
 className="inline-flex min-h-12 items-center bg-[#f6f2ea] px-8 text-xs font-medium tracking-[0.22em] text-[#1d1b1a] uppercase transition-colors hover:bg-white"
 >
 Shop Now
 </Link>
 <Link
 href="/products?sort=latest"
 className="inline-flex min-h-12 items-center gap-2 text-xs tracking-[0.22em] text-white uppercase underline underline-offset-8"
 >
 New In <ArrowRight className="size-4" />
 </Link>
 </div>
 </div>
 </div>
 </div>
 </section>

 <div aria-hidden className="full-bleed overflow-hidden border-b border-[#1d1b1a] py-3">
 <div className="animate-marquee flex w-max">
 {[0, 1, 2, 3].map((group) => (
 <div key={group} className="flex shrink-0 items-center">
 {marqueeItems.map((item) => (
 <span key={item} className="flex items-center font-heading text-xl whitespace-nowrap text-[#1d1b1a] italic sm:text-2xl">
 {item}
 <span className="px-6 text-sm text-[#7a1730] not-italic">&#10022;</span>
 </span>
 ))}
 </div>
 ))}
 </div>
 </div>
 </div>

 <section className="grid grid-cols-3 divide-x divide-[#1d1b1a]/20 text-center">
 {brandStats.map((item) => (
 <div key={item.label} className="space-y-2 px-2 sm:px-6">
 <p className="font-heading text-[clamp(2.25rem,7vw,6rem)] leading-none text-[#1d1b1a]">{item.value}</p>
 <p className="text-[0.62rem] tracking-[0.18em] text-[#5f5954] uppercase sm:text-xs sm:tracking-[0.22em]">{item.label}</p>
 </div>
 ))}
 </section>

 {newArrivals.length > 0 ? (
 <section className="space-y-8 sm:space-y-12">
 <SectionHeading
 number="01"
 title="New Arrivals"
 description="The latest pieces to join the collection, fresh from the studio."
 href="/products?sort=latest"
 />
 <NewArrivalsEditorial items={newArrivals.map(toCarouselItem)} />
 </section>
 ) : null}

 <section className="space-y-8 sm:space-y-12">
 <SectionHeading
 number="02"
 title="Top Selling"
 description="Curated customer favorites from this season."
 />
 <TopSellingCarousel items={categoryHighlights} />
 </section>

 <section className="full-bleed bg-[#1d1b1a] text-[#f6f2ea]">
 <div className="mx-auto grid max-w-[1440px] lg:grid-cols-2">
 <div className="flex items-center p-7 sm:p-10 lg:p-14">
 <div className="max-w-xl space-y-6">
 <p className="text-xs tracking-[0.28em] text-[#b9b1a6]">N&deg; 03 &mdash; {editorialShowcase.label}</p>
 <h2 className="font-heading whitespace-pre-line text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.9] font-medium tracking-[-0.02em] italic">
 {editorialShowcase.title}
 </h2>
 <p className="text-base leading-relaxed text-[#d9d2c7]">{editorialShowcase.description}</p>
 <Link
 href="/products"
 className="inline-flex min-h-11 items-center gap-2 border-b border-[#f6f2ea]/60 text-sm tracking-[0.22em] transition-colors hover:border-[#f6f2ea]"
 >
 {editorialShowcase.cta}
 <ArrowRight className="size-4" />
 </Link>
 </div>
 </div>

 <div className="relative min-h-[420px] overflow-hidden lg:min-h-[720px]">
 <div className="absolute inset-0">
 <LazyShowcaseVideo
 src={editorialShowcase.video}
 className="h-full w-full bg-cover bg-center object-cover object-center animate-hero-zoom"
 />
 </div>
 </div>
 </div>
 </section>

 <section className="space-y-8 sm:space-y-12">
 <SectionHeading
 number="04"
 title="Our Products"
 description="Discover timeless pieces designed for confidence, elegance, and everyday luxury."
 href="/products"
 />
 <FeaturedProductsCarousel items={featuredCatalogProducts.map(toCarouselItem)} />
 </section>
 </div>
 );
}
