import type { Metadata } from "next";

import { absoluteUrl, searchLogoPath, siteName } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Custom Orders",
  description:
    "Start a custom womenswear order with theootd.brand and share your preferred style, measurements, color, and delivery details.",
  alternates: {
    canonical: "/custom-order",
  },
  openGraph: {
    title: `Custom Orders | ${siteName}`,
    description:
      "Create a custom womenswear piece with theootd.brand, tailored around your preferred style and fit.",
    url: absoluteUrl("/custom-order"),
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

export default function CustomOrderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
