'use client';

import Link from 'next/link';
import { Coins, Gift } from 'lucide-react';
import { useMe } from '@/hooks/use-engagement';

export function PointsBanner() {
  const { data: me } = useMe();
  const loggedIn = Boolean(me?.user);
  const points = me?.profile?.total_points ?? 0;

  return (
    <div className="mb-8 rounded-xl border border-primary/20 bg-card/50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <Gift className="w-5 h-5 text-primary shrink-0 mt-0.5 sm:mt-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">Earn points on every purchase</p>
          <p className="text-xs text-muted mt-0.5">
            5 points per $1 spent
            {loggedIn ? (
              <>
                {' · '}
                <span className="inline-flex items-center gap-1 text-primary font-semibold">
                  <Coins className="w-3.5 h-3.5" />
                  {points.toLocaleString()} pts
                </span>
              </>
            ) : (
              <>
                {' · '}
                <a
                  href="/api/auth/discord/login?return_to=/shop"
                  className="text-primary hover:underline"
                >
                  Login with Discord
                </a>{' '}
                to track & redeem
              </>
            )}
          </p>
        </div>
      </div>
      <Link
        href="/rewards"
        className="text-xs font-medium text-primary hover:underline whitespace-nowrap shrink-0"
      >
        View rewards →
      </Link>
    </div>
  );
}
