import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SectionHeading } from "@/components/store/section-heading";
import { absoluteUrl, searchLogoPath, siteName } from "@/lib/site-metadata";

export const metadata: Metadata = {
 title: "About",
 description:
 "Learn about theootd.brand, a womenswear brand creating polished ready-to-wear pieces and custom looks with thoughtful fit.",
 alternates: {
 canonical: "/about",
 },
 openGraph: {
 title: `About | ${siteName}`,
 description:
 "Meet the point of view behind theootd.brand: refined silhouettes, clean finishing, and pieces that feel personal.",
 url: absoluteUrl("/about"),
 images: [
 {
 url: searchLogoPath,
 width: 512,
 height: 512,
 alt: `${siteName} logo`,
 },
 ],
 },
};

const milestones = [
 {
 year: "2023",
 title: "The First Sketch",
 description:
 "theootd.brand began with a clear point of view: make refined pieces that help women feel instantly put together.",
 },
 {
 year: "2024",
 title: "Capsule Collections",
 description:
 "Early drops focused on flattering silhouettes, premium finishing, and versatile looks that move easily from day to night.",
 },
 {
 year: "2025",
 title: "Custom Pieces",
 description:
 "As the community grew, custom orders became part of the brand, giving customers pieces shaped around their own style.",
 },
] as const;

const values = [
 {
 title: "Intentional Style",
 description: "Every silhouette is chosen for elegance, movement, and wearability.",
 },
 {
 title: "Thoughtful Fit",
 description: "Proportions, measurements, and finishing details are treated with care.",
 },
 {
 title: "Made To Feel Personal",
 description: "Each piece is designed to help the wearer feel confident, seen, and fully herself.",
 },
] as const;

const processSteps = [
 "Shape the mood and silhouette",
 "Select fabric and finishing details",
 "Cut, sew, refine, and fit with care",
] as const;

const ownerProfile = {
 name: "Adeline",
 title: "Creative Director",
 image: "/images/about/adeline-creative-director.jpg",
};

export default function AboutPage() {
 return (
 <div className="space-y-16 sm:space-y-24">
 <section className="full-bleed animate-fade-up -mt-5 border-b border-[#1d1b1a] sm:-mt-8">
 <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[1.15fr_0.85fr]">
 <div className="flex items-end px-3 py-10 sm:px-5 sm:py-14 lg:px-6 lg:py-20 xl:px-8">
 <div className="space-y-6">
 <p className="text-xs tracking-[0.28em] text-[#c2185b] uppercase">About the brand</p>
 <h1 className="font-heading text-[clamp(3.5rem,11vw,10rem)] leading-[0.86] font-medium tracking-[-0.03em] text-[#1d1b1a] italic">
 theootd.brand
 </h1>
 <p className="max-w-2xl text-base leading-relaxed text-[#5f5954] sm:text-lg">
 Elevated womenswear made for confident entrances, soft details, and the feeling of wearing something
 that was chosen with intention.
 </p>
 <div className="flex flex-wrap items-center gap-5">
 <Link
 href="/products"
 className="inline-flex min-h-12 items-center gap-2 bg-[#1d1b1a] px-8 text-xs font-medium tracking-[0.22em] text-[#f6f2ea] uppercase transition-colors hover:bg-[#332f2c]"
 >
 Shop Pieces
 <ArrowRight className="size-4" />
 </Link>
 <Link
 href="/custom-order"
 className="inline-flex min-h-12 items-center text-xs tracking-[0.22em] text-[#1d1b1a] uppercase underline underline-offset-8"
 >
 Start Custom Order
 </Link>
 </div>
 </div>
 </div>
 <div className="relative min-h-[460px] overflow-hidden sm:min-h-[620px] lg:min-h-[760px]">
 <Image
 src={ownerProfile.image}
 alt={`${ownerProfile.name}, ${ownerProfile.title} of theootd.brand`}
 fill
 className="object-cover object-center"
 sizes="(min-width: 1024px) 42vw, 100vw"
 priority
 />
 <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent p-6 text-white">
 <p className="font-heading text-3xl leading-none italic drop-shadow-md">{ownerProfile.name}</p>
 <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white drop-shadow-md">{ownerProfile.title}</p>
 </div>
 </div>
 </div>
 </section>

 <section className="grid gap-6 lg:grid-cols-12 lg:gap-10">
 <p className="text-xs tracking-[0.28em] text-[#c2185b] uppercase lg:col-span-3">Our Point Of View</p>
 <div className="space-y-6 lg:col-span-9">
 <h2 className="font-heading text-[clamp(2.75rem,6.5vw,6rem)] leading-[0.98] font-medium tracking-[-0.02em] text-[#1d1b1a]">
 Clothing should make the moment feel sharper.
 </h2>
 <div className="grid gap-4 text-sm leading-relaxed text-[#5f5954] sm:grid-cols-2 sm:gap-8 sm:text-base">
 <p>
 theootd.brand creates pieces for women who want polish without losing softness. The work is feminine,
 expressive, and grounded in everyday wearability.
 </p>
 <p>
 From ready-to-wear drops to custom pieces, the goal is the same: refined silhouettes, clean finishing,
 and outfits that feel personal the first time they are worn.
 </p>
 </div>
 </div>
 </section>

 <section className="grid border-y border-[#1d1b1a] md:grid-cols-3 md:divide-x md:divide-[#1d1b1a]/20">
 {values.map((item, index) => (
 <article key={item.title} className="space-y-3 border-b border-[#1d1b1a]/20 py-6 last:border-b-0 md:border-b-0 md:px-6 md:py-8 md:first:pl-0 md:last:pr-0">
 <p className="font-heading text-2xl text-[#c2185b] italic">{String(index + 1).padStart(2, "0")}</p>
 <h3 className="font-heading text-3xl leading-tight text-[#1d1b1a] sm:text-4xl">{item.title}</h3>
 <p className="text-sm leading-relaxed text-[#5f5954] sm:text-base">{item.description}</p>
 </article>
 ))}
 </section>

 <section className="grid gap-12 lg:grid-cols-2 lg:gap-16">
 <div className="space-y-5 border-t border-[#1d1b1a] pt-4">
 <p className="text-xs tracking-[0.28em] text-[#c2185b] uppercase">Meet The Founder</p>
 <h2 className="font-heading text-[clamp(2.5rem,4.5vw,4.25rem)] leading-[0.98] font-medium tracking-[-0.02em] text-[#1d1b1a]">
 Built with a designer eye and customer-first care.
 </h2>
 <p className="text-sm leading-relaxed text-[#5f5954] sm:text-base">
 For Adeline, the brand is about the quiet power of a well-made outfit. A dress can change posture,
 mood, and confidence before a word is spoken.
 </p>
 <p className="text-sm leading-relaxed text-[#5f5954] sm:text-base">
 That belief guides every collection: pieces are edited until they feel beautiful, wearable, and easy
 to make your own.
 </p>
 </div>

 <div className="space-y-5 border-t border-[#1d1b1a] pt-4">
 <p className="text-xs tracking-[0.28em] text-[#c2185b] uppercase">How We Work</p>
 <h2 className="font-heading text-[clamp(2.5rem,4.5vw,4.25rem)] leading-[0.98] font-medium tracking-[-0.02em] text-[#1d1b1a]">
 Designed with intention, finished with care.
 </h2>
 <ol>
 {processSteps.map((step, index) => (
 <li key={step} className="flex items-baseline gap-4 border-t border-[#1d1b1a]/20 py-4">
 <span className="font-heading text-2xl text-[#c2185b] italic">{index + 1}</span>
 <p className="text-sm text-[#3d3731] sm:text-base">{step}</p>
 </li>
 ))}
 </ol>
 </div>
 </section>

 <section className="space-y-8 sm:space-y-12">
 <SectionHeading title="How We Grew" />
 <div>
 {milestones.map((item) => (
 <article key={item.year} className="grid gap-2 border-t border-[#1d1b1a]/20 py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)] md:items-baseline md:gap-8">
 <p className="font-heading text-[clamp(3rem,6vw,5.5rem)] leading-none text-[#1d1b1a] italic">{item.year}</p>
 <h3 className="font-heading text-2xl text-[#1d1b1a] sm:text-3xl">{item.title}</h3>
 <p className="text-sm leading-relaxed text-[#5f5954] sm:text-base">{item.description}</p>
 </article>
 ))}
 </div>
 </section>

 <section className="full-bleed bg-[#1d1b1a] text-[#f6f2ea]">
 <div className="mx-auto grid max-w-[1440px] lg:grid-cols-2">
 <div className="flex items-center p-7 sm:p-10 lg:p-14">
 <div className="max-w-xl space-y-6">
 <h2 className="font-heading text-[clamp(3rem,6.5vw,6.5rem)] leading-[0.92] font-medium tracking-[-0.02em] italic">
 Made for women who dress with presence.
 </h2>
 <p className="text-sm leading-relaxed text-[#d9d2c7] sm:text-base">
 Explore ready-to-wear pieces or request something custom for your next standout moment.
 </p>
 <Link
 href="/custom-order"
 className="inline-flex min-h-11 items-center gap-2 border-b border-[#f6f2ea]/60 text-sm uppercase tracking-[0.18em] transition hover:border-[#f6f2ea]"
 >
 Create Your Piece
 <ArrowRight className="size-4" />
 </Link>
 </div>
 </div>
 <div className="relative aspect-[4/5] overflow-hidden lg:aspect-auto lg:min-h-[760px]">
 <Image
 src="/images/about/presence-cta.jpg"
 alt="Woman in a yellow dress from theootd.brand"
 fill
 className="object-cover object-top"
 sizes="(min-width: 1024px) 50vw, 100vw"
 />
 </div>
 </div>
 </section>
 </div>
 );
}
