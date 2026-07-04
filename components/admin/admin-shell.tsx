'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar, LayoutDashboard, LogOut, Sparkles, Trophy } from 'lucide-react';
import { siteConfig } from '@/lib/site';

const navItems = [
  { href: '/admin' as const, label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/leaderboard' as const, label: 'Leaderboard', icon: Trophy },
  { href: '/admin/wipes' as const, label: 'Wipe Schedule', icon: Calendar },
  { href: '/admin/engagement' as const, label: 'Engagement', icon: Sparkles },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-6 border-b border-border">
          <p className="text-xs uppercase tracking-wider text-muted mb-1">Admin</p>
          <p className="font-bold text-white">{siteConfig.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'text-muted hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <Link
            href="/"
            className="block text-xs text-muted hover:text-foreground transition-colors"
          >
            View site
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="md:hidden border-b border-border bg-card px-4 py-3 flex items-center justify-between gap-3">
          <p className="font-semibold text-sm">Admin Panel</p>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-muted cursor-pointer"
          >
            Sign out
          </button>
        </header>
        <main className="p-4 md:p-8 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
