export const siteName = "theootd.brand";
export const siteTitle = "theootd.brand | Premium Womenswear & Custom Pieces";
export const siteDescription =
  "Premium womenswear and custom pieces from theootd.brand, made for polished everyday style and special moments.";
const defaultSiteUrl = "https://theootdbrand.com";
const configuredSiteUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL;
const shouldUseConfiguredSiteUrl =
  configuredSiteUrl && (process.env.NODE_ENV !== "production" || !configuredSiteUrl.includes("localhost"));

export const siteUrl = new URL(shouldUseConfiguredSiteUrl ? configuredSiteUrl : defaultSiteUrl);
export const canonicalSiteUrl = new URL("/", siteUrl).toString();
export const searchLogoPath = "/images/logo/theootd-search-logo.png";
export const searchLogoUrl = new URL(searchLogoPath, siteUrl).toString();

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
