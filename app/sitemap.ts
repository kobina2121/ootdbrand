import type { MetadataRoute } from "next";

import { encodeProductSlugForPath } from "@/lib/product-slug";
import { listProducts } from "@/lib/services/product-service";
import { absoluteUrl, canonicalSiteUrl } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  let productEntries: MetadataRoute.Sitemap = [];

  try {
    const products = await listProducts({ activeOnly: true, sort: "latest" });
    productEntries = products.map((product) => ({
      url: absoluteUrl(`/products/${encodeProductSlugForPath(product.slug)}`),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch (error) {
    console.warn("Unable to include product URLs in sitemap.", error);
  }

  return [
    {
      url: canonicalSiteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/products"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/custom-order"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/about"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...productEntries,
  ];
}
