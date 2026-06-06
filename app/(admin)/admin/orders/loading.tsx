import { Spinner } from "@/components/ui/spinner";

export default function AdminOrdersLoading() {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-black/10 bg-white/80 dark:border-white/10 dark:bg-zinc-950/75 dark:shadow-black/30">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Spinner />
        Loading orders...
      </div>
    </div>
  );
}
