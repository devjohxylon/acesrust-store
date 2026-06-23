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

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').trim();
  };

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 md:max-w-sm">
            <p className="text-sm font-semibold text-white">
              {store?.title || siteConfig.name}
            </p>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              {store?.description ? stripHtml(store.description) : siteConfig.description}
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <Link href="/" className="text-muted hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/shop" className="text-muted hover:text-foreground transition-colors">
              Shop
            </Link>
            <Link href="/cart" className="text-muted hover:text-foreground transition-colors">
              Cart
            </Link>
            {store?.menu_links?.map((menuLink, index) => (
              <a
                key={index}
                href={menuLink.link.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-foreground transition-colors"
              >
                {menuLink.title}
              </a>
            ))}
          </nav>

          {discordUrl && (
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#5865F2]/15 border border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/25 transition-colors text-xs font-medium shrink-0"
            >
              <FaDiscord className="w-4 h-4" />
              Join Our Discord
            </a>
          )}
        </div>

        <p className="text-xs text-muted text-center md:text-left mt-4 pt-4 border-t border-border/60">
          &copy; {currentYear} {store?.title || siteConfig.name}
        </p>
      </div>
    </footer>
  );
}
