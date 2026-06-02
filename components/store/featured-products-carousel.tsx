"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FeaturedProductSlide = {
  slug: string;
  name: string;
  category: string;
  description?: string;
  sizes?: string[];
  colors?: string[];
  rating?: number;
  price: string;
  image: string;
};

export function FeaturedProductsCarousel({ items }: { items: FeaturedProductSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const count = items.length;

  const goTo = (index: number) => {
    if (count === 0) {
      return;
    }

    const nextIndex = (index + count) % count;
    setActiveIndex(nextIndex);
    const container = containerRef.current;
    const item = itemRefs.current[nextIndex];

    if (container && item) {
      container.scrollTo({
        left: item.offsetLeft,
        behavior: "smooth",
      });
    }
  };

  const next = () => goTo(activeIndex + 1);
  const prev = () => goTo(activeIndex - 1);

  useEffect(() => {
    if (isPaused || count <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % count;
        const container = containerRef.current;
        const item = itemRefs.current[nextIndex];

        if (container && item) {
          container.scrollTo({
            left: item.offsetLeft,
            behavior: "smooth",
          });
        }

        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [count, isPaused]);

  const dots = useMemo(() => items.map((_, i) => i), [items]);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Featured products will appear here soon.</p>;
  }

  return (
    <div className="space-y-6">
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          ref={containerRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1"
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {items.map((product, index) => (
            <div
              key={product.slug}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className="min-w-[88%] snap-center sm:min-w-[calc(50%-8px)] lg:min-w-[calc(33.333%-11px)] xl:min-w-[calc(25%-12px)]"
            >
              <Card className="group h-full overflow-hidden border-[#cfd3d8] bg-white shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#dedede] p-6">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 639px) 88vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
                    unoptimized
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <CardContent className="space-y-3 p-5 text-center">
                  <Link
                    href={`/products?category=${encodeURIComponent(product.category)}`}
                    className="inline-flex text-[0.7rem] uppercase tracking-[0.2em] text-[#6b7280] underline-offset-4 transition hover:text-[#1f2937] hover:underline"
                  >
                    {product.category}
                  </Link>
                  <h3 className="font-heading text-[1.7rem] leading-tight text-[#1f2937]">{product.name}</h3>
                  {product.description ? (
                    <p className="min-h-[3rem] text-sm leading-relaxed text-[#6b7280]">{product.description}</p>
                  ) : null}
                  <div className="space-y-1 text-sm text-[#5f6368]">
                    {product.sizes && product.sizes.length > 0 ? <p>Sizes: {product.sizes.join(", ")}</p> : null}
                    {product.colors && product.colors.length > 0 ? <p>Colors: {product.colors.join(", ")}</p> : null}
                  </div>
                  <p className="text-sm tracking-wide text-[#a47531]">{"★★★★★"} {product.rating ? `(${product.rating.toFixed(1)})` : "(5.0)"}</p>
                  <p className="pt-2 text-center text-2xl font-semibold text-[#111827]">{product.price}</p>
                  <div className="pt-1 text-center">
                    <Link
                      href={`/products/${product.slug}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "rounded-full border-black/20 px-5 text-[#1f2937] hover:border-black hover:bg-black hover:text-white",
                      )}
                    >
                      View Product
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="justify-self-start rounded-full"
          onClick={prev}
        >
          <ChevronLeft className="size-6 text-[#374151]" />
          <span className="sr-only">Previous featured products</span>
        </Button>

        <div className="flex items-center justify-center gap-2">
          {dots.map((dot) => (
            <button
              key={dot}
              type="button"
              onClick={() => goTo(dot)}
              className={`rounded-full transition-all ${activeIndex === dot ? "h-4 w-4 border border-[#1f2937] bg-transparent" : "h-2.5 w-2.5 bg-[#1f2937]/80"}`}
              aria-label={`Go to featured product ${dot + 1}`}
            >
              {activeIndex === dot ? <span className="mx-auto mt-[4px] block h-1.5 w-1.5 rounded-full bg-[#1f2937]" /> : null}
            </button>
          ))}
        </div>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="justify-self-end rounded-full"
          onClick={next}
        >
          <ChevronRight className="size-6 text-[#374151]" />
          <span className="sr-only">Next featured products</span>
        </Button>
      </div>
    </div>
  );
}
