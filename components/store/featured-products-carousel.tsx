"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FeaturedProductSlide = {
  slug: string;
  name: string;
  category: string;
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
    <div className="space-y-4">
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
            >
              <Card className="group min-w-[88%] snap-center overflow-hidden border-black/10 bg-white/95 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:min-w-[calc(50%-8px)] lg:min-w-[calc(33.333%-11px)] xl:min-w-[calc(25%-12px)]">
                <CardHeader className="space-y-3 p-3">
                  <div className="h-44 overflow-hidden rounded-lg bg-muted">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <CardTitle className="text-base">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pb-4">
                  <p className="text-sm text-muted-foreground">{product.category}</p>
                  <p className="font-semibold text-[#1f1b18]">{product.price}</p>
                  <Link
                    href={`/products/${product.slug}`}
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mt-1 h-8 px-0 text-sm")}
                  >
                    View Product
                  </Link>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full md:inline-flex"
          onClick={prev}
        >
          <ChevronLeft className="size-5" />
          <span className="sr-only">Previous featured products</span>
        </Button>

        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full md:inline-flex"
          onClick={next}
        >
          <ChevronRight className="size-5" />
          <span className="sr-only">Next featured products</span>
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2">
        {dots.map((dot) => (
          <button
            key={dot}
            type="button"
            onClick={() => goTo(dot)}
            className={`h-2.5 rounded-full transition-all ${activeIndex === dot ? "w-7 bg-foreground" : "w-2.5 bg-foreground/30"}`}
            aria-label={`Go to featured product ${dot + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
