import Image from "next/image";

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
    <div role="img" aria-label={label} className="grid grid-cols-2 gap-1">
      {[topImage, bottomImage].map((image, index) => (
        <div key={`${image}-${index}`} className="relative aspect-[3/4] overflow-hidden bg-[#e9e4da]">
          <Image src={image} alt="" fill sizes={sizes} className="object-cover object-top" />
        </div>
      ))}
    </div>
  );
}
