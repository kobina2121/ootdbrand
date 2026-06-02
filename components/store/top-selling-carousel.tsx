"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type Slide = {
  title: string;
  image: string;
};

export function TopSellingCarousel({ items }: { items: Slide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const count = items.length;

  const goTo = (index: number) => {
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
    if (isPaused) {
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
    }, 3800);

    return () => clearInterval(timer);
  }, [count, isPaused]);

  const dots = useMemo(() => items.map((_, i) => i), [items]);

  return (
    <div className="space-y-4">
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          ref={containerRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth"
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {items.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className="group relative h-[520px] min-w-full snap-center overflow-hidden rounded-xl bg-[#efefef] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:min-w-[calc(50%-8px)] md:h-[620px] lg:min-w-[calc(33.333%-11px)]"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/14 via-transparent to-transparent" />
            </div>
          ))}
        </div>

        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full md:inline-flex"
          onClick={prev}
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Previous slide</span>
        </Button>

        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full md:inline-flex"
          onClick={next}
        >
          <ChevronRight className="h-5 w-5" />
          <span className="sr-only">Next slide</span>
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2">
        {dots.map((dot) => (
          <button
            key={dot}
            type="button"
            onClick={() => goTo(dot)}
            className={`h-2.5 rounded-full transition-all ${activeIndex === dot ? "w-7 bg-foreground" : "w-2.5 bg-foreground/30"}`}
            aria-label={`Go to slide ${dot + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
