import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
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
  title: "Tide E-commerce",
  description: "Production-ready clothing e-commerce MVP",
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
