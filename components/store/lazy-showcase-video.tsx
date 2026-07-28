"use client";

import { useEffect, useRef, useState } from "react";

export function LazyShowcaseVideo({
 src,
 poster,
 className,
}: {
 src: string;
 poster: string;
 className?: string;
}) {
 const containerRef = useRef<HTMLDivElement | null>(null);
 const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

 useEffect(() => {
 const container = containerRef.current;
 if (!container) {
 return;
 }

 const observer = new IntersectionObserver(
 ([entry]) => {
 if (entry?.isIntersecting) {
 setShouldLoadVideo(true);
 observer.disconnect();
 }
 },
 { rootMargin: "300px" },
 );

 observer.observe(container);
 return () => observer.disconnect();
 }, []);

 return (
 <div ref={containerRef} className="h-full w-full">
 {shouldLoadVideo ? (
 <video
 src={src}
 poster={poster}
 autoPlay
 muted
 loop
 playsInline
 preload="metadata"
 className={className}
 >
 Your browser does not support the video preview.
 </video>
 ) : (
 <div
 aria-label="Signature dresses preview"
 role="img"
 className={className}
 style={{ backgroundImage: `url(${poster})` }}
 />
 )}
 </div>
 );
}
