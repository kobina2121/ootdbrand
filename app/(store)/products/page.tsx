import Link from "next/link";

import { ProductGrid } from "@/components/store/product-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listProducts } from "@/lib/services/product-service";

type PageProps = {
 searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductListPage({ searchParams }: PageProps) {
 const params = await searchParams;
 const category = typeof params.category === "string" ? params.category : "all";
 const sort = typeof params.sort === "string" ? params.sort : "latest";
 const q = typeof params.q === "string" ? params.q.trim() : "";
 const pageParam = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
 const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
 const pageSize = 9;

 const [allProducts, categoryFilteredProducts] = await Promise.all([
 listProducts({ activeOnly: true, sort: "latest" }),
 listProducts({ activeOnly: true, category, sort: sort as "latest" | "price-asc" | "price-desc" }),
 ]);

 const categories = ["all", ...new Set(allProducts.map((product) => product.category))];
 const normalizedQuery = q.toLowerCase();
 const filteredProducts =
 normalizedQuery.length === 0
 ? categoryFilteredProducts
 : categoryFilteredProducts.filter((product) =>
 [product.name, product.category, product.description].some((value) =>
 value.toLowerCase().includes(normalizedQuery),
 ),
 );
 const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
 const safePage = Math.min(page, totalPages);
 const paginatedProducts = filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize);

 const buildProductsHref = (nextCategory: string, nextSort: string) => {
 const query = new URLSearchParams({
 category: nextCategory,
 sort: nextSort,
 page: "1",
 });

 if (q) {
 query.set("q", q);
 }

 return `/products?${query.toString()}`;
 };
 const buildPageHref = (nextPage: number) => {
 const query = new URLSearchParams({
 category,
 sort,
 page: String(nextPage),
 });

 if (q) {
 query.set("q", q);
 }

 return `/products?${query.toString()}`;
 };

 return (
 <div className="space-y-8">
	 <section className="rounded-2xl border border-black/10 bg-[linear-gradient(135deg,#f7f5f1_0%,#f0ece6_100%)] p-4 shadow-sm sm:rounded-3xl sm:p-7">
	 <div className="flex flex-wrap items-start justify-between gap-4">
	 <div className="space-y-2">
	 <p className="text-[0.8rem] tracking-[0.18em] text-[#5f5954]">THEOOTD SHOP</p>
	 <h1 className="font-heading text-4xl leading-none text-[#1f1b18] sm:text-6xl">All Products</h1>
 <p className="section-subtitle max-w-xl">
 Discover signature silhouettes crafted for confidence, comfort, and timeless elegance.
 </p>
 </div>
	 <form action="/products" method="get" className="flex w-full max-w-md flex-col items-stretch gap-2 sm:flex-row sm:items-center">
 <input type="hidden" name="category" value={category} />
 <input type="hidden" name="sort" value={sort} />
 <Input
 name="q"
 defaultValue={q}
 placeholder="Search products..."
 aria-label="Search products"
 className="h-10 rounded-full border-black/15 bg-white/90 "
 />
 <Button type="submit" className="h-10 rounded-full px-5">
 Search
 </Button>
 </form>
 </div>
 </section>

	 <section className="rounded-2xl border border-black/10 bg-white/80 p-3 shadow-sm sm:p-4">
 <div className="mb-3 flex items-center justify-between gap-3">
 <p className="text-[0.8rem] tracking-[0.16em] text-[#5f5954] uppercase">
 {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"} available
 </p>
 {q ? <Badge variant="secondary" className="rounded-full px-3 py-1">Search: {q}</Badge> : null}
 </div>
 <div className="flex flex-wrap items-center gap-2">
 {categories.map((entry) => (
 <Link
 key={entry}
 href={buildProductsHref(entry, sort)}
 aria-current={entry === category ? "page" : undefined}
 className="inline-flex min-h-11 items-center rounded-full"
 >
 <Badge variant={entry === category ? "default" : "outline"} className="rounded-full px-4 py-2">
 {entry === "all" ? "All" : entry}
 </Badge>
 </Link>
 ))}
 <Link href={buildProductsHref(category, "latest")} aria-current={sort === "latest" ? "page" : undefined}>
 <Button variant={sort === "latest" ? "default" : "outline"} className="rounded-full">
 Sort: Latest
 </Button>
 </Link>
 <Link href={buildProductsHref(category, "price-asc")} aria-current={sort === "price-asc" ? "page" : undefined}>
 <Button variant={sort === "price-asc" ? "default" : "outline"} className="rounded-full">
 Price ↑
 </Button>
 </Link>
 <Link href={buildProductsHref(category, "price-desc")} aria-current={sort === "price-desc" ? "page" : undefined}>
 <Button variant={sort === "price-desc" ? "default" : "outline"} className="rounded-full">
 Price ↓
 </Button>
 </Link>
 </div>
 </section>

 <section>
 {paginatedProducts.length > 0 ? (
 <ProductGrid
 products={paginatedProducts.map((product) => ({
 slug: product.slug,
 name: product.name,
 category: product.category,
 description: product.description,
 image: product.image,
 price: product.basePrice,
 sizes: [...new Set(product.variants.map((variant) => variant.size))],
 rating: 5,
 reviewCount: 0,
 }))}
 />
 ) : (
 <div className="rounded-2xl border border-dashed border-black/25 bg-white/70 p-10 text-center ">
 <p className="text-lg font-medium text-[#1f1b18] ">No products found</p>
 <p className="mt-1 text-sm text-muted-foreground">
 {q ? `No match for "${q}". Try another search or clear filters.` : "Try a different category or clear filters."}
 </p>
 <Link href="/products" className="mt-4 inline-block">
 <Button variant="outline" className="rounded-full">Reset filters</Button>
 </Link>
 </div>
 )}
 </section>

 {paginatedProducts.length > 0 ? (
 <section className="flex items-center justify-end gap-2">
 <Link
 href={buildPageHref(Math.max(1, safePage - 1))}
 aria-disabled={safePage <= 1}
 className={safePage <= 1 ? "pointer-events-none opacity-50" : ""}
 >
 <Button variant="outline" size="sm" className="rounded-full">Prev</Button>
 </Link>
 <Badge variant="outline" className="rounded-full px-3 py-1">
 Page {safePage} of {totalPages}
 </Badge>
 <Link
 href={buildPageHref(Math.min(totalPages, safePage + 1))}
 aria-disabled={safePage >= totalPages}
 className={safePage >= totalPages ? "pointer-events-none opacity-50" : ""}
 >
 <Button variant="outline" size="sm" className="rounded-full">Next</Button>
 </Link>
 </section>
 ) : null}
 </div>
 );
}
