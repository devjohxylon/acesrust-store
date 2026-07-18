'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, Flame, Gift, LogOut, User, Users } from 'lucide-react';
import { FaDiscord } from 'react-icons/fa';
import { useLogout, useMe } from '@/hooks/use-engagement';
import { isValidAvatarUrl } from '@/lib/engagement/avatar';

export function LoginButton() {
  const { data, isLoading } = useMe();
  const logout = useLogout();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (!mounted || isLoading) {
    return <div className="w-11 h-11 sm:w-24 sm:h-9 rounded-lg bg-card border border-border shimmer" />;
  }

  const user = data?.user;
  if (!user) {
    return (
      <a
        href={`/api/auth/discord/login?return_to=${encodeURIComponent(pathname)}`}
        className="flex items-center justify-center gap-2 min-w-11 h-11 sm:h-auto px-3 sm:px-4 py-2 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] text-white text-sm font-medium transition-colors touch-manipulation"
      >
        <FaDiscord className="w-4 h-4" />
        <span className="hidden sm:inline">Login</span>
      </a>
    );
  }

  const profile = data?.profile;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-1.5 pr-1.5 sm:pr-3 py-1.5 min-h-11 sm:min-h-0 rounded-lg bg-card border border-border hover:border-primary transition-colors cursor-pointer touch-manipulation"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <span className="relative w-7 h-7 rounded-full overflow-hidden bg-border shrink-0">
          {isValidAvatarUrl(user.avatar) ? (
            <Image src={user.avatar} alt={user.username} fill className="object-cover" unoptimized />
          ) : (
            <User className="w-4 h-4 absolute inset-0 m-auto text-muted" />
          )}
        </span>
        {profile && (
          <>
            <span className="hidden sm:inline text-sm font-semibold text-primary">
              {profile.total_points.toLocaleString()}
            </span>
            {profile.streak_count > 0 && (
              <span className="hidden sm:flex items-center gap-0.5 text-xs text-orange-400 font-medium">
                <Flame className="w-3.5 h-3.5" />
                {profile.streak_count}
              </span>
            )}
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[min(13rem,calc(100vw-1.5rem))] rounded-xl bg-card border border-border shadow-xl overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-white truncate">{user.username}</p>
              {profile && (
                <p className="text-xs text-muted mt-0.5">
                  {profile.total_points.toLocaleString()} points
                  {profile.streak_count > 0 ? ` · ${profile.streak_count} day streak` : ''}
                </p>
              )}
            </div>
            <nav className="p-1.5">
              <Link
                href="/profile/me"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-3 sm:py-2 rounded-lg text-sm text-foreground/80 hover:text-foreground hover:bg-white/5 transition-colors touch-manipulation"
              >
                <User className="w-4 h-4" />
                My Profile
              </Link>
              <Link
                href="/achievements"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-3 sm:py-2 rounded-lg text-sm text-foreground/80 hover:text-foreground hover:bg-white/5 transition-colors touch-manipulation"
              >
                <Award className="w-4 h-4" />
                Achievements
              </Link>
              <Link
                href="/community"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-3 sm:py-2 rounded-lg text-sm text-foreground/80 hover:text-foreground hover:bg-white/5 transition-colors touch-manipulation"
              >
                <Users className="w-4 h-4" />
                Community
              </Link>
              <Link
                href="/rewards"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-3 sm:py-2 rounded-lg text-sm text-foreground/80 hover:text-foreground hover:bg-white/5 transition-colors touch-manipulation"
              >
                <Gift className="w-4 h-4" />
                Rewards
              </Link>
              <button
                type="button"
                onClick={async () => {
                  setOpen(false);
                  await logout.mutateAsync();
                  router.refresh();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-3 sm:py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer touch-manipulation"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
