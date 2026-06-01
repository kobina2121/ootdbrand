import { featuredProducts } from "@/lib/mock-data";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FeaturedProductsCarousel } from "@/components/store/featured-products-carousel";
import { TopSellingCarousel } from "@/components/store/top-selling-carousel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const heroImage = "/images/hero/hero-main.jpg";

const categoryHighlights = [
  {
    title: "Look 1",
    image: "/images/categories/womens.jpg",
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

const editorialShowcase = {
  label: "APPAREL",
  title: "Signature\nDresses",
  description:
    "Elevated silhouettes made to flatter every shape. Step into timeless pieces that carry confidence from day to night.",
  cta: "SHOP COLLECTION",
  image: "/images/categories/accessories.jpg",
  video: "/videos/editorial-showcase.mp4",
} as const;

export default function HomePage() {
  return (
    <div className="relative space-y-10 sm:space-y-12">
      <div className="pointer-events-none absolute -left-20 top-20 hidden h-52 w-52 rounded-full bg-[#c8d4bc]/40 blur-3xl md:block animate-drift-x" />
      <div className="pointer-events-none absolute -right-16 top-[28rem] hidden h-64 w-64 rounded-full bg-[#d8c8ba]/35 blur-3xl md:block animate-drift-x-reverse" />

      <section className="animate-fade-up relative h-[68svh] min-h-[500px] overflow-hidden rounded-3xl border border-black/10 bg-[#d9d6cf] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.45)] sm:h-[75svh] lg:h-[88svh] lg:min-h-[780px]">
        <img
          src={heroImage}
          alt="theootd.brand hero"
          className="absolute inset-0 h-full w-full object-cover object-[center_18%] lg:object-[center_12%] animate-hero-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/45 lg:from-black/10 lg:to-black/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.26),transparent_36%)]" />

        <div className="animate-fade-up-delay-1 absolute bottom-24 left-1/2 z-10 w-full max-w-4xl -translate-x-1/2 px-4 text-center text-white sm:bottom-28 lg:bottom-20">
          <p className="mb-2 text-xs tracking-[0.35em] text-white/85 sm:text-sm">NEW COLLECTION</p>
          <h1 className="font-heading text-[clamp(2.2rem,8vw,5.7rem)] font-semibold leading-[0.95] drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
            Wear Your Story
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-white/90 sm:text-base">
            Every stitch speaks confidence, elegance, and the woman you are becoming.
          </p>
        </div>

        <div className="animate-fade-up-delay-2 absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 sm:bottom-10 sm:gap-3 animate-soft-float">
          <Link
            href="/products"
            className={cn(
              buttonVariants({}),
              "animate-pulse-glow rounded-full bg-white px-7 text-[#3b2526] shadow-lg shadow-black/20 hover:!bg-white hover:text-[#3b2526] focus:!bg-white active:!bg-white sm:px-10",
            )}
          >
            SHOP NOW!
          </Link>
          <Link
            href="/products?sort=latest"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-full border-white/70 bg-white/10 px-6 text-white backdrop-blur hover:bg-white/20",
            )}
          >
            New In <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="animate-fade-up-delay-1 rounded-2xl border border-black/10 bg-[linear-gradient(125deg,#f7f5f1_0%,#f0ece6_100%)] px-6 py-6 shadow-sm sm:px-10 sm:py-8">
        <div className="grid gap-5 text-center sm:grid-cols-3 sm:divide-x sm:divide-black/10">
          {brandStats.map((item) => (
            <div key={item.label} className="space-y-1 sm:px-6">
              <p className="animate-soft-float font-heading text-4xl leading-none tracking-wide text-[#1f1b18] sm:text-5xl">{item.value}</p>
              <p className="text-[0.68rem] tracking-[0.22em] text-[#6e6761] uppercase sm:text-xs">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="animate-fade-up-delay-2 space-y-4">
        <div className="space-y-1 text-center">
          <h2 className="text-center font-sans text-[18px] font-normal tracking-[0.12em] text-foreground">TOP SELLING</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">Curated customer favorites from this season.</p>
        </div>
        <TopSellingCarousel items={categoryHighlights} />
      </section>

      <section className="animate-fade-up overflow-hidden rounded-3xl border border-black/10 bg-[#f4f3ef] shadow-sm">
        <div className="grid lg:grid-cols-2">
          <div className="relative flex items-center p-7 sm:p-10 lg:p-14">
            <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-[#d9ccc0]/45 blur-3xl" />
            <div className="max-w-md space-y-6">
              <p className="text-xs tracking-[0.3em] text-muted-foreground">{editorialShowcase.label}</p>
              <h3 className="font-heading text-5xl leading-[0.95] text-[#1d1b1a] sm:text-6xl whitespace-pre-line">
                {editorialShowcase.title}
              </h3>
              <p className="text-base leading-relaxed text-[#6e6761]">{editorialShowcase.description}</p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 border-b border-black/40 pb-1 text-sm tracking-[0.22em] text-[#222]"
              >
                {editorialShowcase.cta}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="relative min-h-[420px]">
            <video
              src={editorialShowcase.video}
              poster={editorialShowcase.image}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover object-center animate-hero-zoom"
            >
              <img
                src={editorialShowcase.image}
                alt={editorialShowcase.title}
                className="h-full w-full object-cover object-center animate-hero-zoom"
              />
            </video>
          </div>
        </div>
      </section>

      <section className="animate-fade-up rounded-2xl border border-black/10 bg-white/85 p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[0.65rem] uppercase tracking-[0.28em] text-[#7b756f]">Editors&apos; Picks</p>
            <h2 className="font-heading text-3xl leading-none text-[#1f1b18] sm:text-4xl">Featured Products</h2>
          </div>
          <Link
            href="/products"
            className={cn(buttonVariants({ variant: "ghost" }), "text-muted-foreground transition hover:bg-black/5 hover:text-black")}
          >
            View all
          </Link>
        </div>

        <FeaturedProductsCarousel
          items={featuredProducts.map((product) => ({
            slug: product.slug,
            name: product.name,
            category: product.category,
            price: product.price,
            image:
              featuredImageBySlug[product.slug] ??
              "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=900&q=80",
          }))}
        />
      </section>
    </div>
  );
}
