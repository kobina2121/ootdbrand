import Image from "next/image";

// Where the two photos meet: the waist of a model framed head to toe in a 2:3 photo.
const WAIST_LINE_PERCENT = 39.5;

export function OutfitPreview({
  topImage,
  bottomImage,
  label,
  sizes,
}: {
  topImage: string;
  bottomImage: string;
  label: string;
  sizes: string;
}) {
  return (
    <div role="img" aria-label={label} className="relative aspect-[2/3] overflow-hidden bg-white">
      <Image
        src={bottomImage}
        alt=""
        fill
        sizes={sizes}
        className="object-cover object-top"
        style={{ clipPath: `inset(${WAIST_LINE_PERCENT}% 0 0 0)` }}
      />
      <Image
        src={topImage}
        alt=""
        fill
        sizes={sizes}
        className="object-cover object-top"
        style={{ clipPath: `inset(0 0 ${100 - WAIST_LINE_PERCENT}% 0)` }}
      />
    </div>
  );
}
