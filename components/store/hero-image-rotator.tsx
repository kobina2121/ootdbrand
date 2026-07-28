"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function HeroImageRotator({ images }: { images: readonly string[] }) {
 const [shouldLoadCarousel, setShouldLoadCarousel] = useState(false);
 const [firstImage, ...restImages] = images;

 useEffect(() => {
 const loadCarousel = () => setShouldLoadCarousel(true);
 const windowWithIdleCallback = window as Window & {
 requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
 cancelIdleCallback?: (handle: number) => void;
 };

 if (windowWithIdleCallback.requestIdleCallback) {
 const handle = windowWithIdleCallback.requestIdleCallback(loadCarousel, { timeout: 1800 });
 return () => windowWithIdleCallback.cancelIdleCallback?.(handle);
 }

 const timer = window.setTimeout(loadCarousel, 1400);
 return () => window.clearTimeout(timer);
 }, []);

 if (!firstImage) {
 return null;
 }

 return (
 <>
 <Image
 src={firstImage}
 alt="theootd.brand hero 1"
 fill
 sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1024px) calc(100vw - 3rem), 1440px"
 className="absolute inset-0 h-full w-full object-cover object-[center_22%] lg:object-[center_16%] animate-hero-carousel"
 style={{ animationDelay: "0s" }}
 priority
 />
 {shouldLoadCarousel
 ? restImages.map((image, index) => (
 <Image
 key={image}
 src={image}
 alt={`theootd.brand hero ${index + 2}`}
 fill
 sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1024px) calc(100vw - 3rem), 1440px"
 className="absolute inset-0 h-full w-full object-cover object-[center_22%] lg:object-[center_16%] animate-hero-carousel"
 style={{ animationDelay: `${index + 1}s` }}
 />
 ))
 : null}
 </>
 );
}
