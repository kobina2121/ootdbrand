import type { Metadata } from "next";
import Link from "next/link";

import { PageMasthead } from "@/components/store/page-masthead";
import { ProductGrid } from "@/components/store/product-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listProducts } from "@/lib/services/product-service";
import { absoluteUrl, searchLogoPath, siteName } from "@/lib/site-metadata";

export const metadata: Metadata = {
 title: "Shop Premium Womenswear",
 description:
 "Shop ready-to-wear dresses, tops, sets, and custom-inspired womenswear from theootd.brand.",
 alternates: {
 canonical: "/products",
 },
 openGraph: {
 title: `Shop Premium Womenswear | ${siteName}`,
 description:
 "Discover ready-to-wear dresses, tops, sets, and custom-inspired womenswear from theootd.brand.",
 url: absoluteUrl("/products"),
 images: [
 {
 url: searchLogoPath,
 width: 512,
 height: 512,
 alt: `${siteName} logo`,
 },
 ],
 },
};

type PageProps = {
 searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function filterLinkClass(isActive: boolean) {
 return `inline-flex min-h-11 items-center text-xs tracking-[0.18em] uppercase underline-offset-8 transition-colors ${isActive ? "text-[#1d1b1a] underline" : "text-[#5f5954] hover:text-[#1d1b1a]"}`;
}

export default async function ProductListPage({ searchParams }: PageProps) {
 const params = await searchParams;
 const category = typeof params.category === "string" ? params.category : "all";
 const sort = typeof params.sort === "string" ? params.sort : "latest";
 const q = typeof params.q === "string" ? params.q.trim() : "";
 const pageParam = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
 const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
 const pageSize = 9;

 const allProducts = await listProducts({ activeOnly: true, sort: "latest" });

 const categories = ["all", ...new Set(allProducts.map((product) => product.category))];
 const categoryFilteredProducts =
 category.toLowerCase() === "all"
 ? allProducts
 : allProducts.filter((product) => product.category.toLowerCase() === category.toLowerCase());
 const sortedProducts =
 sort === "price-asc"
 ? [...categoryFilteredProducts].sort((a, b) => a.basePrice - b.basePrice)
 : sort === "price-desc"
 ? [...categoryFilteredProducts].sort((a, b) => b.basePrice - a.basePrice)
 : categoryFilteredProducts;
 const normalizedQuery = q.toLowerCase();
 const filteredProducts =
 normalizedQuery.length === 0
 ? sortedProducts
 : sortedProducts.filter((product) =>
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
 <PageMasthead
 kicker="Theootd Shop"
 title="All Products"
 description="Discover signature silhouettes crafted for confidence, comfort, and timeless elegance."
 >
 <form action="/products" method="get" className="flex w-full items-stretch gap-2 lg:w-96">
 <input type="hidden" name="category" value={category} />
 <input type="hidden" name="sort" value={sort} />
 <Input
 name="q"
 defaultValue={q}
 placeholder="Search products..."
 aria-label="Search products"
 className="h-11 border-[#1d1b1a]/30 bg-transparent"
 />
 <Button type="submit" className="h-11 px-5">
 Search
 </Button>
 </form>
 </PageMasthead>

 <section className="flex flex-col gap-2 border-b border-[#1d1b1a]/20 pb-2 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
 <div className="flex flex-wrap items-center gap-x-5">
 {categories.map((entry) => (
 <Link
 key={entry}
 href={buildProductsHref(entry, sort)}
 aria-current={entry === category ? "page" : undefined}
 className={filterLinkClass(entry === category)}
 >
 {entry === "all" ? "All" : entry}
 </Link>
 ))}
 </div>
 <div className="flex flex-wrap items-center gap-x-5">
 <p className="mr-auto text-xs tracking-[0.16em] text-[#5f5954] uppercase lg:mr-2">
 {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
 </p>
 {q ? <Badge variant="secondary" className="px-3 py-1">Search: {q}</Badge> : null}
 <Link href={buildProductsHref(category, "latest")} aria-current={sort === "latest" ? "page" : undefined} className={filterLinkClass(sort === "latest")}>
 Latest
 </Link>
 <Link href={buildProductsHref(category, "price-asc")} aria-current={sort === "price-asc" ? "page" : undefined} className={filterLinkClass(sort === "price-asc")} aria-label="Price, low to high">
 Price ↑
 </Link>
 <Link href={buildProductsHref(category, "price-desc")} aria-current={sort === "price-desc" ? "page" : undefined} className={filterLinkClass(sort === "price-desc")} aria-label="Price, high to low">
 Price ↓
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
	 image: product.image,
	 price: product.basePrice,
	 variants: product.variants.map((variant) => ({
	 name: variant.name,
	 size: variant.size,
	 color: variant.color,
	 colorCode: variant.colorCode,
	 image: variant.image,
	 sku: variant.sku,
	 stock: variant.stock,
	 priceOverride: variant.priceOverride,
	 })),
	 rating: product.rating,
	 reviewCount: product.reviewCount,
	 }))}
 />
 ) : (
 <div className="border border-dashed border-[#1d1b1a]/30 p-10 text-center">
 <p className="text-lg font-medium text-[#1f1b18] ">No products found</p>
 <p className="mt-1 text-sm text-muted-foreground">
 {q ? `No match for "${q}". Try another search or clear filters.` : "Try a different category or clear filters."}
 </p>
 <Link href="/products" className="mt-4 inline-block">
 <Button variant="outline" className="rounded-none">Reset filters</Button>
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
 <Button variant="outline" size="sm" className="rounded-none">Prev</Button>
 </Link>
 <Badge variant="outline" className="px-3 py-1">
 Page {safePage} of {totalPages}
 </Badge>
 <Link
 href={buildPageHref(Math.min(totalPages, safePage + 1))}
 aria-disabled={safePage >= totalPages}
 className={safePage >= totalPages ? "pointer-events-none opacity-50" : ""}
 >
 <Button variant="outline" size="sm" className="rounded-none">Next</Button>
 </Link>
 </section>
 ) : null}
 </div>
 );
}
