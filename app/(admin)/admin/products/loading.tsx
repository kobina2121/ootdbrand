import { Spinner } from "@/components/ui/spinner";

export default function AdminProductsLoading() {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-black/10 bg-white/80">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Spinner />
        Loading products...
      </div>
    </div>
  );
}
