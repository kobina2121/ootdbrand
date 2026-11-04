import type { Metadata } from "next";
import Link from "next/link";

import { ComboBuilder } from "@/components/store/combo-builder";
import { COMBO_DISCOUNT_GHS, isBottomCategory, isTopCategory } from "@/lib/combo";
import { formatPriceNgn } from "@/lib/products";
import { listProducts } from "@/lib/services/product-service";
import { absoluteUrl, searchLogoPath, siteName } from "@/lib/site-metadata";

const comboDescription = `Pair any top with a skirt, pants or capris from theootd.brand and save ${formatPriceNgn(COMBO_DISCOUNT_GHS)} on the combo.`;

export const metadata: Metadata = {
  title: "Build a Combo",
  description: comboDescription,
  alternates: {
    canonical: "/combo",
  },
  openGraph: {
    title: `Build a Combo | ${siteName}`,
    description: comboDescription,
    url: absoluteUrl("/combo"),
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

export default async function ComboPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const products = await listProducts({ activeOnly: true, sort: "latest" });
  const tops = products.filter((product) => isTopCategory(product.category) && product.variants.length > 0);
  const bottoms = products.filter((product) => isBottomCategory(product.category) && product.variants.length > 0);
  const isReady = tops.length > 0 && bottoms.length > 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-black/10 bg-[linear-gradient(135deg,#f7f5f1_0%,#f0ece6_100%)] p-4 shadow-sm sm:rounded-3xl sm:p-7">
        <p className="text-[0.8rem] tracking-[0.18em] text-[#5f5954] uppercase">Mix &amp; Match</p>
        <h1 className="mt-2 font-heading text-4xl leading-none text-[#1f1b18] sm:text-6xl">Build Your Combo</h1>
        <p className="section-subtitle mt-2 max-w-xl">
          Pick any top, pair it with a skirt, pants or capris, choose a size for each, and save {formatPriceNgn(COMBO_DISCOUNT_GHS)}.
        </p>
      </section>

      {isReady ? (
        <ComboBuilder
          tops={tops}
          bottoms={bottoms}
          initialTopSlug={typeof params.top === "string" ? params.top : undefined}
          initialBottomSlug={typeof params.bottom === "string" ? params.bottom : undefined}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-black/25 bg-white/70 p-10 text-center">
          <p className="text-lg font-medium text-[#1f1b18]">New pieces are on the way</p>
          <p className="mt-1 text-sm text-muted-foreground">Combos open as soon as tops and bottoms are both in the shop.</p>
          <Link
            href="/products"
            className="mt-4 inline-flex min-h-11 items-center rounded-full border border-black/20 px-5 text-sm font-medium text-[#1f1b18]"
          >
            Browse the shop
          </Link>
        </div>
      )}
    </div>
  );
}
