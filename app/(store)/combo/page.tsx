import type { Metadata } from "next";
import Link from "next/link";

import { ComboBuilder } from "@/components/store/combo-builder";
import { PageMasthead } from "@/components/store/page-masthead";
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
    <div className="space-y-8 sm:space-y-12">
      <PageMasthead
        kicker="Mix & Match"
        title="Build Your Combo"
        description={`Pick any top, pair it with a skirt, pants or capris, choose a size for each, and save ${formatPriceNgn(COMBO_DISCOUNT_GHS)}.`}
      />

      {isReady ? (
        <ComboBuilder
          tops={tops}
          bottoms={bottoms}
          initialTopSlug={typeof params.top === "string" ? params.top : undefined}
          initialBottomSlug={typeof params.bottom === "string" ? params.bottom : undefined}
        />
      ) : (
        <div className="border border-dashed border-[#1d1b1a]/30 p-10 text-center">
          <p className="font-heading text-3xl text-[#1d1b1a]">New pieces are on the way</p>
          <p className="mt-2 text-sm text-[#5f5954]">Combos open as soon as tops and bottoms are both in the shop.</p>
          <Link
            href="/products"
            className="mt-4 inline-flex min-h-11 items-center text-xs tracking-[0.22em] text-[#1d1b1a] uppercase underline underline-offset-8"
          >
            Browse the shop
          </Link>
        </div>
      )}
    </div>
  );
}
