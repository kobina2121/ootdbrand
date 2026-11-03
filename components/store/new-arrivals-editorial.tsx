import Image from "next/image";
import Link from "next/link";

import { encodeProductSlugForPath } from "@/lib/product-slug";
import { cn } from "@/lib/utils";

type NewArrivalItem = {
  slug: string;
  name: string;
  category: string;
  price: string;
  image: string;
};

// Uneven spans give the magazine-spread rhythm; the lead product is always the newest.
const layoutByIndex = [
  { item: "col-span-2 lg:col-span-7", sizes: "(max-width: 1023px) 100vw, 58vw" },
  { item: "lg:col-span-5 lg:mt-32", sizes: "(max-width: 1023px) 50vw, 42vw" },
  { item: "lg:col-span-4", sizes: "(max-width: 1023px) 50vw, 33vw" },
  { item: "col-span-2 lg:col-span-6 lg:col-start-7 lg:mt-20", sizes: "(max-width: 1023px) 100vw, 50vw" },
] as const;

export function NewArrivalsEditorial({ items }: { items: NewArrivalItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 lg:grid-cols-12 lg:gap-y-16">
      {items.map((product, index) => {
        const layout = layoutByIndex[index % layoutByIndex.length];

        return (
          <Link
            key={product.slug}
            href={`/products/${encodeProductSlugForPath(product.slug)}`}
            className={cn("group block", layout.item)}
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-[#e9e4da]">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes={layout.sizes}
                className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>
            <div className="mt-3 flex items-start justify-between gap-3 sm:mt-4">
              <div className="min-w-0">
                <p className="text-[0.68rem] tracking-[0.22em] text-[#5f5954] uppercase">{product.category}</p>
                <h3 className="mt-1 font-heading text-2xl leading-tight text-[#1d1b1a] underline-offset-4 group-hover:underline sm:text-3xl">
                  {product.name}
                </h3>
              </div>
              <p className="shrink-0 text-sm font-medium text-[#1d1b1a] sm:text-base">{product.price}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
