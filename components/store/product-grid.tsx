import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPriceNgn } from "@/lib/products";

type Product = {
  slug: string;
  name: string;
  category: string;
  image: string;
  price: number;
  sizes: string[];
  rating?: number;
};

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card
          key={product.slug}
          className="group hover-lift overflow-hidden rounded-2xl border-black/10 bg-white/90 dark:border-white/10 dark:bg-[#181513]/90"
        >
          <CardHeader className="space-y-3 p-3 sm:p-4">
            <div className="relative overflow-hidden rounded-xl">
              <Image
                src={product.image}
                alt={product.name}
                width={900}
                height={900}
                unoptimized
                className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="space-y-1">
              <Badge variant="secondary" className="rounded-full bg-black/5 text-[#5c554f] dark:bg-white/10 dark:text-[#e0d7cf]">
                {product.category}
              </Badge>
              <CardTitle className="text-xl text-[#1f1b18] dark:text-white">{product.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3 sm:px-4 sm:pb-4">
            <p className="text-lg font-semibold text-[#1f1b18] dark:text-white">{formatPriceNgn(product.price)}</p>
            <p className="text-sm tracking-wide text-[#a47531]">{"★★★★★"} ({(product.rating ?? 5).toFixed(1)})</p>
            {product.sizes.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {product.sizes.map((size) => (
                  <Badge
                    key={`${product.slug}-${size}`}
                    variant="outline"
                    className="rounded-full border-black/20 bg-white px-2.5 text-[0.68rem] text-[#4f4841] dark:border-white/20 dark:bg-white/10 dark:text-[#f3ece5]"
                  >
                    {size}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="p-3 pt-0 sm:p-4 sm:pt-0">
            <Link href={`/products/${product.slug}`} className="w-full">
              <Button className="w-full rounded-full">View Product</Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
