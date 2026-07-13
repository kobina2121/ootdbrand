import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Ruler, Sparkles, Target } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
 icon: Sparkles,
 title: "Intentional Style",
 description: "Every silhouette is chosen for elegance, movement, and wearability.",
 },
 {
 icon: Ruler,
 title: "Thoughtful Fit",
 description: "Proportions, measurements, and finishing details are treated with care.",
 },
 {
 icon: Heart,
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
 image: "/images/about/adeline-owner.jpeg",
};

export default function AboutPage() {
 return (
 <div className="space-y-10 sm:space-y-12">
 <section className="overflow-hidden rounded-3xl border border-black/10 bg-[#f4f3ef] shadow-sm">
 <div className="grid lg:grid-cols-[1fr_0.82fr]">
 <div className="flex min-h-[420px] items-center p-7 sm:p-10 lg:p-14">
 <div className="max-w-3xl space-y-6">
 <p className="text-xs uppercase tracking-[0.28em] text-[#6f6860]">About the brand</p>
 <div className="space-y-4">
 <h1 className="font-heading text-[clamp(3.2rem,10vw,7rem)] font-semibold leading-[0.9] text-[#1f1b18]">
 theootd.brand
 </h1>
 <p className="max-w-2xl text-base leading-relaxed text-[#625b54] sm:text-lg">
 Elevated womenswear made for confident entrances, soft details, and the feeling of wearing something
 that was chosen with intention.
 </p>
 </div>
 <div className="flex flex-wrap gap-3">
 <Link
 href="/products"
 className={cn(buttonVariants({}), "rounded-full px-7")}
 >
 Shop Pieces
 <ArrowRight className="size-4" />
 </Link>
 <Link
 href="/custom-order"
 className={cn(buttonVariants({ variant: "outline" }), "rounded-full border-black/20 bg-white/70 px-7")}
 >
 Start Custom Order
 </Link>
 </div>
 </div>
 </div>
 <div className="relative min-h-[420px] overflow-hidden border-t border-black/10 lg:border-l lg:border-t-0">
 <Image
 src={ownerProfile.image}
 alt={`${ownerProfile.name}, ${ownerProfile.title} of theootd.brand`}
 fill
 className="object-cover object-center"
 sizes="(min-width: 1024px) 42vw, 100vw"
 priority
 />
 <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent p-6 text-white">
 <p className="font-heading text-3xl leading-none drop-shadow-md">{ownerProfile.name}</p>
 <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white drop-shadow-md">{ownerProfile.title}</p>
 </div>
 </div>
 </div>
 </section>

 <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
 <Card className="border-black/10 bg-white/90 shadow-sm">
 <CardContent className="space-y-5 p-6 sm:p-8">
 <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">Our Point Of View</p>
 <h2 className="font-heading text-4xl font-semibold leading-none text-[#1f1b18] sm:text-5xl">
 Clothing should make the moment feel sharper.
 </h2>
 <p className="text-sm leading-relaxed text-[#6b655f] sm:text-base">
 theootd.brand creates pieces for women who want polish without losing softness. The work is feminine,
 expressive, and grounded in everyday wearability.
 </p>
 <p className="text-sm leading-relaxed text-[#6b655f] sm:text-base">
 From ready-to-wear drops to custom pieces, the goal is the same: refined silhouettes, clean finishing,
 and outfits that feel personal the first time they are worn.
 </p>
 </CardContent>
 </Card>

 <Card className="border-black/10 bg-[#f7f5f1] shadow-sm">
 <CardContent className="grid gap-3 p-6 sm:p-8">
 {values.map((item) => {
 const Icon = item.icon;

 return (
 <article key={item.title} className="grid gap-3 rounded-2xl border border-black/10 bg-white/80 p-4 sm:grid-cols-[auto_1fr]">
 <div className="flex size-10 items-center justify-center rounded-full bg-black/[0.04]">
 <Icon className="size-4 text-[#2a241f]" />
 </div>
 <div>
 <h3 className="text-sm font-semibold text-[#1f1b18] sm:text-base">{item.title}</h3>
 <p className="mt-1 text-sm leading-relaxed text-[#6e6761]">{item.description}</p>
 </div>
 </article>
 );
 })}
 </CardContent>
 </Card>
 </section>

 <section className="grid gap-4 lg:grid-cols-2">
 <Card className="border-black/10 bg-white/90 shadow-sm">
 <CardContent className="space-y-4 p-6 sm:p-8">
 <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">Meet The Founder</p>
 <h2 className="font-heading text-4xl font-semibold leading-none text-[#1f1b18] sm:text-5xl">
 Built with a designer eye and customer-first care.
 </h2>
 <p className="text-sm leading-relaxed text-[#6b655f] sm:text-base">
 For Adeline, the brand is about the quiet power of a well-made outfit. A dress can change posture,
 mood, and confidence before a word is spoken.
 </p>
 <p className="text-sm leading-relaxed text-[#6b655f] sm:text-base">
 That belief guides every collection: pieces are edited until they feel beautiful, wearable, and easy
 to make your own.
 </p>
 </CardContent>
 </Card>

 <Card className="border-black/10 bg-[#f4f3ef] shadow-sm">
 <CardContent className="space-y-4 p-6 sm:p-8">
 <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">How We Work</p>
 <h2 className="font-heading text-4xl font-semibold leading-none text-[#1f1b18] sm:text-5xl">
 Designed with intention, finished with care.
 </h2>
 <div className="space-y-3 pt-2">
 {processSteps.map((step, index) => (
 <div key={step} className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/80 px-4 py-3">
 <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1f1b18] text-xs font-semibold text-white">
 {index + 1}
 </span>
 <p className="text-sm text-[#514b45] sm:text-base">{step}</p>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 </section>

 <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
 <Card className="border-black/10 bg-[#f4f3ef] shadow-sm">
 <CardContent className="space-y-4 p-6 sm:p-8">
 <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">Our History</p>
 <h2 className="font-heading text-4xl font-semibold leading-none text-[#1f1b18] sm:text-5xl">How We Grew</h2>
 <div className="space-y-4 pt-2">
 {milestones.map((item) => (
 <article key={item.year} className="rounded-2xl border border-black/10 bg-white px-4 py-4">
 <p className="text-xs text-muted-foreground">{item.year}</p>
 <h3 className="mt-1 text-sm font-semibold text-[#231f1c] sm:text-base">{item.title}</h3>
 <p className="mt-1 text-sm leading-relaxed text-[#6b655f]">{item.description}</p>
 </article>
 ))}
 </div>
 </CardContent>
 </Card>

 <section className="relative flex min-h-[520px] overflow-hidden rounded-3xl border border-black/10 text-white shadow-sm">
 <Image
 src="/images/about/presence-cta.jpg"
 alt="Woman in a yellow dress from theootd.brand"
 fill
 className="object-cover object-center"
 sizes="(min-width: 1024px) 40vw, 100vw"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
 <div className="relative z-10 mt-auto max-w-lg space-y-5 p-6 sm:p-8">
 <Target className="size-8 text-white/75" />
 <h2 className="font-heading text-4xl font-semibold leading-none sm:text-5xl">
 Made for women who dress with presence.
 </h2>
 <p className="text-sm leading-relaxed text-white/75 sm:text-base">
 Explore ready-to-wear pieces or request something custom for your next standout moment.
 </p>
 <Link
 href="/custom-order"
 className="inline-flex items-center gap-2 border-b border-white/50 pb-1 text-sm uppercase tracking-[0.18em] text-white transition hover:border-white"
 >
 Create Your Piece
 <ArrowRight className="size-4" />
 </Link>
 </div>
 </section>
 </section>
 </div>
 );
}
