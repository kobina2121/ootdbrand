"use client";

import { Button } from "@/components/ui/button";

export default function StorefrontError({
 reset,
}: {
 error: Error & { digest?: string };
 reset: () => void;
}) {
 return (
 <div className="rounded-3xl border border-dashed border-black/25 bg-white/75 p-10 text-center shadow-sm ">
 <h2 className="font-heading text-5xl leading-none ">Something went wrong</h2>
 <p className="mt-2 text-sm text-muted-foreground">
 We could not load this storefront section. Please try again in a moment.
 </p>
 <Button className="mt-4 rounded-full" onClick={reset}>
 Try again
 </Button>
 </div>
 );
}
