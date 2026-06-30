'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import type { Store } from '@/lib/schemas';

interface SiteChromeProps {
  initialStore?: Store | null;
  children: React.ReactNode;
}

export function SiteChrome({ initialStore, children }: SiteChromeProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Header initialStore={initialStore} />
      <main className="flex-1">{children}</main>
      <Footer initialStore={initialStore} />
    </>
  );
}
