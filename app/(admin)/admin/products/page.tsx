import Link from "next/link";
import { Package, Plus, Search } from "lucide-react";

import { ProductTableActions } from "@/components/admin/product-table-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listProductsForAdminPaged } from "@/lib/services/product-service";

type AdminProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProductTablePage({ searchParams }: AdminProductsPageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const statusParam = typeof params.status === "string" ? params.status : "all";
  const status = statusParam === "active" || statusParam === "inactive" ? statusParam : "all";
  const pageParam = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const { products, pagination } = await listProductsForAdminPaged({
    q,
    status,
    page,
    pageSize: 10,
  });

  const activeCount = products.filter((product) => product.isActive).length;
  const draftCount = products.length - activeCount;
  const buildHref = (nextPage: number, nextStatus = status) => {
    const query = new URLSearchParams();
    query.set("page", String(nextPage));

    if (q) {
      query.set("q", q);
    }

    if (nextStatus !== "all") {
      query.set("status", nextStatus);
    }

    return `/admin/products?${query.toString()}`;
  };

  return (
    <div className="space-y-5">
      <Card className="border-black/10 bg-white/85 shadow-sm dark:border-white/10 dark:bg-zinc-950/75 dark:shadow-black/30">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.16em] text-muted-foreground">Inventory</p>
              <CardTitle className="font-sans text-2xl font-semibold">Product Management</CardTitle>
            </div>
            <Link href="/admin/products/new">
              <Button className="gap-2 rounded-full">
                <Plus className="size-4" />
                Create Product
              </Button>
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Matching products</p>
              <p className="text-lg font-semibold">{pagination.totalCount}</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Active (page)</p>
              <p className="text-lg font-semibold">{activeCount}</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Inactive (page)</p>
              <p className="text-lg font-semibold">{draftCount}</p>
            </div>
          </div>
          <div className="space-y-3">
            <form action="/admin/products" method="get" className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q}
                className="h-10 rounded-full border-black/15 pl-9 dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:placeholder:text-white/40 dark:focus-visible:ring-white/20"
                placeholder="Search products..."
              />
            </form>
            <div className="flex flex-wrap gap-2">
              <Link href={buildHref(1, "all")}>
                <Badge
                  variant={status === "all" ? "default" : "outline"}
                  className="rounded-full px-3 py-1 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/70 data-[variant=default]:dark:bg-white data-[variant=default]:dark:text-zinc-950"
                >
                  All
                </Badge>
              </Link>
              <Link href={buildHref(1, "active")}>
                <Badge
                  variant={status === "active" ? "default" : "outline"}
                  className="rounded-full px-3 py-1 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/70 data-[variant=default]:dark:bg-white data-[variant=default]:dark:text-zinc-950"
                >
                  Active
                </Badge>
              </Link>
              <Link href={buildHref(1, "inactive")}>
                <Badge
                  variant={status === "inactive" ? "default" : "outline"}
                  className="rounded-full px-3 py-1 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/70 data-[variant=default]:dark:bg-white data-[variant=default]:dark:text-zinc-950"
                >
                  Inactive
                </Badge>
              </Link>
              {q ? (
                <Link href={buildHref(1, status)}>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 dark:bg-white/[0.08] dark:text-white/80">
                    Search: {q}
                  </Badge>
                </Link>
              ) : null}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-black/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-zinc-950/80 dark:shadow-black/30">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/[0.05]">
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="size-6 text-muted-foreground" />
                      <p>No products found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <Badge
                        variant={product.isActive ? "default" : "outline"}
                        className={
                          product.isActive
                            ? "dark:bg-white dark:text-zinc-950"
                            : "dark:border-white/15 dark:bg-white/[0.03] dark:text-white/70"
                        }
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.variantsCount}</TableCell>
                    <TableCell className="text-right">
                      <ProductTableActions productId={product.id} productName={product.name} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Link
          href={buildHref(Math.max(1, pagination.page - 1))}
          aria-disabled={pagination.page <= 1}
          className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
        >
          <Button variant="outline" size="sm" className="rounded-full">Prev</Button>
        </Link>
        <Badge variant="outline" className="rounded-full border-black/20 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/60">
          Page {pagination.page} of {pagination.totalPages}
        </Badge>
        <Link
          href={buildHref(Math.min(pagination.totalPages, pagination.page + 1))}
          aria-disabled={pagination.page >= pagination.totalPages}
          className={pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}
        >
          <Button variant="outline" size="sm" className="rounded-full">Next</Button>
        </Link>
      </div>
    </div>
  );
}
