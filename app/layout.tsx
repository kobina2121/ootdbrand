import type { Metadata } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
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
  title: "theootd.brand E-commerce",
  description: "Production-ready clothing e-commerce MVP",
};

const themeInitializer = `
(() => {
  try {
    const storageKey = 'theootd-theme';
    const storedTheme = localStorage.getItem(storageKey) || 'light';
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const resolvedTheme = storedTheme === 'system' ? systemTheme : storedTheme;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  } catch (error) {
    document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = 'light';
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`h-full antialiased ${montserrat.variable} ${cormorantGaramond.variable}`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors">
        <Script id="theme-initializer" strategy="beforeInteractive">
          {themeInitializer}
        </Script>
        <ThemeProvider defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
