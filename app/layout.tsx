import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { SiteChrome } from "@/components/layout/site-chrome";
import { Tip4ServScript } from "@/components/providers/tip4serv-script";
import { getStoreWhoami } from "@/lib/api-client";
import { siteConfig } from "@/lib/site";
import { shareMetadata } from "@/lib/share-metadata";
import { config } from "@/lib/config";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(config.app.siteUrl),
  title: shareMetadata.title,
  description: shareMetadata.description,
  openGraph: {
    title: shareMetadata.title,
    description: shareMetadata.description,
    siteName: siteConfig.name,
    url: config.app.siteUrl,
    type: 'website',
    images: [
      {
        url: siteConfig.logo,
        width: 1024,
        height: 1024,
        alt: shareMetadata.title,
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: shareMetadata.title,
    description: shareMetadata.description,
    images: [siteConfig.logo],
  },
  icons: {
    icon: siteConfig.logo,
    apple: siteConfig.logo,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch store info server-side for SSR
  const initialStore = await getStoreWhoami();

  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <Tip4ServScript />
          <div className="min-h-screen flex flex-col">
            <SiteChrome initialStore={initialStore}>{children}</SiteChrome>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
