import Image from "next/image";

type Look = {
  src: string;
  alt: string;
  position: string;
};

export function HeroLookCarousel({ looks }: { looks: readonly [Look, Look, Look, Look] }) {
  // The set repeats so the track can slide on and restart without a visible jump.
  const slides = [...looks, ...looks];

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="animate-look-carousel flex h-full w-[800%] lg:w-[400%]">
        {slides.map((look, index) => (
          <div key={`${look.src}-${index}`} className="relative h-full w-1/8 shrink-0">
            <Image
              src={look.src}
              alt={index < looks.length ? look.alt : ""}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
              unoptimized
              className="object-cover"
              style={{ objectPosition: look.position }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
