'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AnimatedBackground } from '@/components/effects/animated-background';
import { CheckinToast } from '@/components/engagement/checkin-toast';
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
      <AnimatedBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header initialStore={initialStore} />
        <main className="flex-1">{children}</main>
        <Footer initialStore={initialStore} />
        <CheckinToast />
      </div>
    </>
  );
}
