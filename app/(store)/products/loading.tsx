import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-black/10 bg-white/85 dark:border-white/10 dark:bg-[#181513]/90">
        <CardHeader className="space-y-3">
          <Skeleton className="h-4 w-28 dark:bg-white/10" />
          <Skeleton className="h-10 w-56 dark:bg-white/10" />
          <Skeleton className="h-4 w-full max-w-xl dark:bg-white/10" />
        </CardHeader>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={`product-skeleton-${index}`} className="rounded-2xl border-black/10 bg-white/90 dark:border-white/10 dark:bg-[#181513]/90">
            <CardHeader className="space-y-3 p-4">
              <Skeleton className="h-56 w-full rounded-xl dark:bg-white/10" />
              <Skeleton className="h-4 w-20 rounded-full dark:bg-white/10" />
              <Skeleton className="h-5 w-2/3 dark:bg-white/10" />
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              <Skeleton className="h-4 w-12 dark:bg-white/10" />
              <Skeleton className="h-5 w-24 dark:bg-white/10" />
              <Skeleton className="h-9 w-full rounded-full dark:bg-white/10" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
