import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StorefrontLoading() {
 return (
 <div className="space-y-8">
 <Card className="overflow-hidden rounded-3xl border-black/10 bg-white/85">
 <CardHeader className="space-y-4 p-5 sm:p-8">
 <Skeleton className="h-4 w-36" />
 <Skeleton className="h-16 w-full max-w-xl" />
 <Skeleton className="h-4 w-full max-w-2xl" />
 </CardHeader>
 <CardContent className="grid gap-4 p-5 pt-0 sm:grid-cols-3 sm:p-8 sm:pt-0">
 <Skeleton className="h-40 rounded-2xl" />
 <Skeleton className="h-40 rounded-2xl" />
 <Skeleton className="h-40 rounded-2xl" />
 </CardContent>
 </Card>

 <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
 {Array.from({ length: 6 }).map((_, index) => (
 <Card key={`storefront-loading-${index}`} className="rounded-2xl border-black/10 bg-white/90">
 <CardHeader className="space-y-3 p-4">
 <Skeleton className="h-64 w-full rounded-xl" />
 <Skeleton className="h-4 w-20 rounded-full" />
 <Skeleton className="h-6 w-2/3" />
 </CardHeader>
 <CardContent className="space-y-2 p-4 pt-0">
 <Skeleton className="h-4 w-full" />
 <Skeleton className="h-4 w-3/4" />
 <Skeleton className="h-11 w-full rounded-full" />
 </CardContent>
 </Card>
 ))}
 </div>
 </div>
 );
}
