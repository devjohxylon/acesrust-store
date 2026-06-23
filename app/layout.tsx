import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Tip4ServScript } from "@/components/providers/tip4serv-script";
import { getStoreWhoami } from "@/lib/api-client";
import { siteConfig } from "@/lib/site";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
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
            <Header initialStore={initialStore} />
            <main className="flex-1">
              {children}
            </main>
            <Footer initialStore={initialStore} />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
