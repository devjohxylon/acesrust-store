'use client';

import Link from 'next/link';
import { useStore } from '@/hooks/use-api';
import { FaDiscord } from 'react-icons/fa';
import type { Store } from '@/lib/schemas';
import { siteConfig } from '@/lib/site';

interface FooterProps {
  initialStore?: Store | null;
}

export function Footer({ initialStore }: FooterProps) {
  const { data: fetchedStore } = useStore();
  const store = fetchedStore || initialStore;
  const currentYear = new Date().getFullYear();
  const discordUrl = store?.social_medias?.discord;

  return (
    <footer className="border-t border-border/80 mt-auto pb-[env(safe-area-inset-bottom)]">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-muted">
            &copy; {currentYear} {siteConfig.name}
          </p>

          <nav className="flex flex-wrap gap-x-1 gap-y-1 text-xs text-muted -mx-1">
            <Link href="/shop" className="px-2 py-2 hover:text-foreground transition-colors touch-manipulation">Shop</Link>
            <Link href="/leaderboard" className="px-2 py-2 hover:text-foreground transition-colors touch-manipulation">Leaderboard</Link>
            <Link href="/community" className="px-2 py-2 hover:text-foreground transition-colors touch-manipulation">Community</Link>
            <Link href="/wipes" className="px-2 py-2 hover:text-foreground transition-colors touch-manipulation">Wipes</Link>
            <Link href="/cart" className="px-2 py-2 hover:text-foreground transition-colors touch-manipulation">Cart</Link>
          </nav>

          {discordUrl && (
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-[#5865F2] hover:underline shrink-0 py-2 touch-manipulation"
            >
              <FaDiscord className="w-3.5 h-3.5" />
              Discord
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
