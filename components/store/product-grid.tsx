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
};

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card
          key={product.slug}
          className="group hover-lift overflow-hidden rounded-2xl border-black/10 bg-white/90"
        >
          <CardHeader className="space-y-3 p-3 sm:p-4">
            <div className="overflow-hidden rounded-xl">
              <img
                src={product.image}
                alt={product.name}
                className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="space-y-1">
              <Badge variant="secondary" className="rounded-full bg-black/5 text-[#5c554f]">
                {product.category}
              </Badge>
              <CardTitle className="text-xl">{product.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3 sm:px-4 sm:pb-4">
            <p className="text-sm text-muted-foreground">From</p>
            <p className="text-lg font-semibold">{formatPriceNgn(product.price)}</p>
            {product.sizes.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {product.sizes.map((size) => (
                  <Badge
                    key={`${product.slug}-${size}`}
                    variant="outline"
                    className="rounded-full border-black/20 bg-white px-2.5 text-[0.68rem]"
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
