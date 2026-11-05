"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type Slide = {
  src: string;
  alt: string;
  position: string;
};

const SECONDS_PER_SLIDE = 4;

export function HeroSlideshow({ slides }: { slides: readonly Slide[] }) {
  const [{ activeIndex, previousIndex }, setShown] = useState({ activeIndex: 0, previousIndex: 0 });

  const showSlide = (index: number) => {
    setShown((shown) =>
      index === shown.activeIndex ? shown : { activeIndex: index, previousIndex: shown.activeIndex },
    );
  };

  useEffect(() => {
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // Restarts when a dot is used, so a chosen photo gets its full time on screen.
    const timer = window.setTimeout(() => {
      setShown(({ activeIndex: current }) => ({
        activeIndex: (current + 1) % slides.length,
        previousIndex: current,
      }));
    }, SECONDS_PER_SLIDE * 1000);

    return () => window.clearTimeout(timer);
  }, [activeIndex, slides.length]);

  return (
    <>
      <div className="absolute inset-0 isolate overflow-hidden">
        {slides.map((slide, index) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={index === activeIndex ? slide.alt : ""}
            aria-hidden={index !== activeIndex}
            fill
            sizes="100vw"
            priority
            unoptimized
            // The outgoing photo stays solid underneath, so a photo that is slow
            // to decode never lets the empty background show through the fade.
            className={cn(
              "object-cover",
              index === activeIndex && "z-[1] opacity-100 transition-opacity duration-700 ease-in-out",
              index !== activeIndex && (index === previousIndex ? "opacity-100" : "opacity-0"),
            )}
            style={{ objectPosition: slide.position }}
          />
        ))}
      </div>

      {slides.length > 1 ? (
        <div className="absolute right-1 top-1/2 z-20 flex -translate-y-1/2 flex-col sm:right-3" role="group" aria-label="Choose a hero photo">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Show photo ${index + 1} of ${slides.length}`}
              aria-current={index === activeIndex}
              onClick={() => showSlide(index)}
              className="flex size-11 items-center justify-center"
            >
              <span
                className={cn(
                  "block rounded-full border border-white shadow-sm transition-all",
                  index === activeIndex ? "size-3 bg-white" : "size-2.5 bg-white/30",
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
