'use client';

import Link from 'next/link';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useStore } from '@/hooks/use-api';
import { useCart } from '@/hooks/use-cart';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { Store } from '@/lib/schemas';
import { siteConfig } from '@/lib/site';
import { LoginButton } from '@/components/engagement/login-button';

const NAV = [
  { href: '/shop', label: 'Shop' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/wipes', label: 'Wipes' },
  { href: '/community', label: 'Community' },
] as const;

interface HeaderProps {
  initialStore?: Store | null;
}

export function Header({ initialStore }: HeaderProps) {
  const { data: fetchedStore } = useStore();
  const store = fetchedStore || initialStore;
  const cart = useCart();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItemCount = mounted ? cart.getItemCount() : 0;

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-8 h-8 rounded-md overflow-hidden shrink-0">
              <Image
                src={siteConfig.logo}
                alt={store?.title || siteConfig.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <span className="text-base font-semibold text-white truncate hidden sm:block">
              {store?.title || siteConfig.name}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive(href)
                    ? 'text-white bg-white/5 font-medium'
                    : 'text-muted hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}
            {store?.menu_links?.map((menuLink, index) => (
              <a
                key={index}
                href={menuLink.link.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-md text-sm text-muted hover:text-white transition-colors"
              >
                {menuLink.title}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/cart"
              className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:border-primary/40 transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-background text-[10px] font-bold flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <LoginButton />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -mr-2 cursor-pointer"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden py-3 border-t border-border space-y-0.5">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`block px-2 py-2.5 rounded-md text-sm ${
                  isActive(href) ? 'text-white bg-white/5' : 'text-muted'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            {store?.menu_links?.map((menuLink, index) => (
              <a
                key={index}
                href={menuLink.link.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-2 py-2.5 text-sm text-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                {menuLink.title}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
