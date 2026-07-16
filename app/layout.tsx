import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const siteName = "theootd.brand";
const siteDescription = "Premium womenswear and custom pieces from theootd.brand.";
const siteUrl = new URL(process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000");
const canonicalSiteUrl = new URL("/", siteUrl).toString();
const searchLogoUrl = new URL("/images/logo/theootd-search-logo.png", siteUrl).toString();

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
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  openGraph: {
    title: siteName,
    description: siteDescription,
    siteName,
    type: "website",
    url: canonicalSiteUrl,
    images: [
      {
        url: "/images/logo/theootd-search-logo.png",
        width: 512,
        height: 512,
        alt: `${siteName} logo`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: siteName,
    description: siteDescription,
    images: ["/images/logo/theootd-search-logo.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: siteName,
      alternateName: "THEOOTD",
      url: canonicalSiteUrl,
    },
    {
      "@type": "Organization",
      name: siteName,
      url: canonicalSiteUrl,
      logo: searchLogoUrl,
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
