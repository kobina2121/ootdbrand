import Image from "next/image";
import { Heart, Sparkles, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const milestones = [
  {
    year: "2023",
    title: "The First Sketch",
    description:
      "theootd.brand started with a simple idea: create elegant pieces that make women feel confident the moment they wear them.",
  },
  {
    year: "2024",
    title: "First Collection Launch",
    description:
      "Our first capsule collection introduced flattering silhouettes, premium finishing, and versatile designs for everyday luxury.",
  },
  {
    year: "2025",
    title: "Growing Community",
    description:
      "With support from customers across Ghana and beyond, we expanded into custom orders and seasonal drops.",
  },
] as const;

const values = [
  {
    icon: Sparkles,
    title: "Elegant Design",
    description: "Every piece is designed to be timeless, feminine, and easy to style.",
  },
  {
    icon: Heart,
    title: "Made With Care",
    description: "We focus on quality fabrics, clean finishing, and thoughtful fit details.",
  },
  {
    icon: Target,
    title: "Confidence First",
    description: "Our goal is simple: help every woman feel bold, beautiful, and seen.",
  },
] as const;

const ownerProfile = {
  name: "Adeline",
  title: "Creative Director",
  image: "/images/about/adeline-owner.jpeg",
};

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-black/10 bg-[linear-gradient(135deg,#f7f5f1_0%,#f1ede7_100%)] p-6 shadow-sm sm:p-10">
        <div className="max-w-3xl space-y-5">
          <Badge variant="outline" className="rounded-full border-black/20 bg-white/70 px-4 py-1">
            About theootd.brand
          </Badge>
          <h1 className="font-heading text-5xl leading-none text-[#1f1b18] sm:text-6xl">Our Story</h1>
          <p className="text-base leading-relaxed text-[#645f59] sm:text-lg">
            theootd.brand is built on style, intention, and identity. We create statement pieces for women who want to
            feel effortlessly elegant and unapologetically confident.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card className="border-black/10 bg-white/90 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-black/10 bg-[#f4f3ef]">
              <Image
                src={ownerProfile.image}
                alt={ownerProfile.name}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 42vw, 100vw"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-black/10 bg-white/90 shadow-sm">
          <CardContent className="space-y-4 p-6 sm:p-8">
            <p className="text-xs tracking-[0.28em] text-muted-foreground">MEET THE FOUNDER</p>
            <h2 className="font-heading text-4xl leading-none text-[#1f1b18] sm:text-5xl">{ownerProfile.name}</h2>
            <p className="text-sm uppercase tracking-[0.2em] text-[#6b655f]">{ownerProfile.title}</p>
            <p className="text-sm leading-relaxed text-[#6b655f] sm:text-base">
              theootd.brand started from a clear idea: women deserve pieces that make them feel beautiful, confident,
              and fully themselves. Every collection is built with intention, from silhouette choices to finishing detail.
            </p>
            <p className="text-sm leading-relaxed text-[#6b655f] sm:text-base">
              The brand blends modern elegance with everyday wearability, so every customer can wear something that
              feels personal and timeless.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-black/10 bg-[#f4f3ef] shadow-sm">
          <CardContent className="space-y-3 p-6 sm:p-8">
            <p className="text-xs tracking-[0.28em] text-muted-foreground">OUR HISTORY</p>
            <h2 className="font-heading text-4xl leading-none text-[#1f1b18] sm:text-5xl">How We Grew</h2>
            <div className="space-y-4 pt-2">
              {milestones.map((item) => (
                <article key={item.year} className="rounded-xl border border-black/10 bg-white px-4 py-3">
                  <p className="text-xs tracking-[0.2em] text-muted-foreground">{item.year}</p>
                  <h3 className="mt-1 text-sm font-semibold text-[#231f1c] sm:text-base">{item.title}</h3>
                  <p className="mt-1 text-sm text-[#6b655f]">{item.description}</p>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-black/10 bg-white/85 shadow-sm">
          <CardContent className="space-y-3 p-6 sm:p-8">
            <p className="text-xs tracking-[0.28em] text-muted-foreground">VISION</p>
            <h2 className="font-heading text-4xl leading-none text-[#1f1b18] sm:text-5xl">Why We Exist</h2>
            <p className="text-sm leading-relaxed text-[#6b655f] sm:text-base">
              We design for confidence. Every drop is made to flatter, elevate, and give women looks that feel as good
              as they look.
            </p>
            <p className="text-sm leading-relaxed text-[#6b655f] sm:text-base">
              Beyond clothing, theootd.brand is about expression, ownership of personal style, and wearing every piece
              with bold intention.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {values.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="rounded-2xl border border-black/10 bg-white px-4 py-5 shadow-sm">
              <div className="mb-2 inline-flex rounded-full bg-black/5 p-2">
                <Icon className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#1f1b18]">{item.title}</h3>
              <p className="mt-1 text-sm text-[#6e6761]">{item.description}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
