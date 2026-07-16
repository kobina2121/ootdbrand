import type { MetadataRoute } from "next";

const siteName = "theootd.brand";
const siteDescription = "Premium womenswear and custom pieces from theootd.brand.";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: siteName,
    description: siteDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f5f1",
    theme_color: "#f7f5f1",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "16x16 32x32 48x48",
        type: "image/x-icon",
      },
      {
        src: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/favicon-48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/images/logo/theootd-search-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
