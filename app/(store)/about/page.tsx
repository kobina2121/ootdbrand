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

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-[linear-gradient(135deg,#f7f5f1_0%,#f0ece6_100%)] p-6 shadow-sm sm:p-10">
        <div className="max-w-3xl space-y-4">
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

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-black/10 bg-white/85 shadow-sm">
          <CardContent className="space-y-3 p-6 sm:p-8">
            <p className="text-xs tracking-[0.28em] text-muted-foreground">THE OWNER</p>
            <h2 className="font-heading text-4xl leading-none text-[#1f1b18] sm:text-5xl">Vision Behind the Brand</h2>
            <p className="text-sm leading-relaxed text-[#6b655f] sm:text-base">
              Founded by a fashion enthusiast with a deep love for feminine silhouettes, theootd.brand started as a
              passion project and evolved into a fast-growing label. The vision has always been to create pieces that
              fit beautifully and tell a story of confidence.
            </p>
            <p className="text-sm leading-relaxed text-[#6b655f] sm:text-base">
              From design concept to final stitch, each collection reflects personal style, culture, and the desire to
              make women feel powerful in what they wear.
            </p>
          </CardContent>
        </Card>

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
