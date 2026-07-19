import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { socialLinks } from "@/lib/social-links";
import {
  canonicalSiteUrl,
  searchLogoPath,
  searchLogoUrl,
  siteDescription,
  siteName,
  siteTitle,
  siteUrl,
} from "@/lib/site-metadata";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: siteName,
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "theootd.brand",
    "theootdbrand",
    "premium womenswear",
    "custom womenswear",
    "made in Ghana fashion",
    "women clothing boutique",
  ],
  creator: siteName,
  publisher: siteName,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: searchLogoPath, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName,
    type: "website",
    url: canonicalSiteUrl,
    locale: "en_US",
    images: [
      {
        url: searchLogoPath,
        width: 512,
        height: 512,
        alt: `${siteName} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [searchLogoPath],
  },
};

const sameAs = [socialLinks.instagram, socialLinks.tiktok];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@id": `${canonicalSiteUrl}#website`,
      "@type": "WebSite",
      name: siteName,
      alternateName: "THEOOTD",
      url: canonicalSiteUrl,
      publisher: {
        "@id": `${canonicalSiteUrl}#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${new URL("/products", siteUrl).toString()}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@id": `${canonicalSiteUrl}#organization`,
      "@type": "Organization",
      name: siteName,
      alternateName: ["THEOOTD", "theootdbrand"],
      description: siteDescription,
      url: canonicalSiteUrl,
      logo: {
        "@type": "ImageObject",
        url: searchLogoUrl,
        width: 512,
        height: 512,
      },
      image: searchLogoUrl,
      sameAs,
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+233536477207",
          contactType: "customer service",
          availableLanguage: ["English"],
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${montserrat.variable} ${cormorantGaramond.variable}`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
