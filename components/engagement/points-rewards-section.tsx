'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Coins, Gift, Sparkles } from 'lucide-react';
import { REWARDS } from '@/lib/engagement/rewards';
import { useMe, useRedeem } from '@/hooks/use-engagement';

type Props = {
  /** Full page layout vs compact strip on the shop */
  variant?: 'page' | 'shop';
};

export function PointsRewardsSection({ variant = 'page' }: Props) {
  const { data: me } = useMe();
  const redeem = useRedeem();
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const profile = me?.profile;
  const loggedIn = Boolean(me?.user);
  const points = profile?.total_points ?? 0;

  async function handleRedeem(rewardId: string, rewardName: string) {
    setMessage(null);
    try {
      await redeem.mutateAsync(rewardId);
      setMessage({
        kind: 'ok',
        text: `${rewardName} redeemed! The team will fulfill it shortly.`,
      });
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Redemption failed',
      });
    }
  }

  if (variant === 'shop') {
    return (
      <section className="mb-10 rounded-2xl border border-primary/25 bg-gradient-card overflow-hidden">
        <div className="px-5 py-4 border-b border-primary/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-bold text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Spend Your Points
            </h2>
            <p className="text-xs text-muted mt-1 flex items-center gap-1.5 flex-wrap">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Every purchase earns <span className="text-primary font-semibold">5 points per $1</span>
              {loggedIn && profile ? (
                <>
                  {' · '}
                  You have{' '}
                  <span className="text-primary font-semibold">{points.toLocaleString()} pts</span>
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
                  to earn & redeem
                </>
              )}
            </p>
          </div>
          <Link
            href="/rewards"
            className="text-xs text-primary hover:underline whitespace-nowrap shrink-0"
          >
            View all rewards →
          </Link>
        </div>

        {message && (
          <div
            className={`mx-5 mt-4 rounded-lg border px-3 py-2 text-xs ${
              message.kind === 'ok'
                ? 'border-primary/40 bg-primary/10 text-white'
                : 'border-red-500/40 bg-red-500/10 text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="p-5 grid gap-3 sm:grid-cols-3">
          {REWARDS.map((reward) => {
            const affordable = points >= reward.cost;
            return (
              <div
                key={reward.id}
                className="rounded-xl border border-border bg-card/70 p-4 flex flex-col gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{reward.name}</p>
                  <p className="text-[11px] text-muted mt-1 line-clamp-2">{reward.description}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-primary">{reward.cost.toLocaleString()} pts</span>
                  <button
                    type="button"
                    disabled={!loggedIn || !affordable || redeem.isPending}
                    onClick={() => handleRedeem(reward.id, reward.name)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-background hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Redeem
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Gift className="w-7 h-7 text-primary" />
          Rewards
        </h1>
        {loggedIn && profile ? (
          <p className="text-muted mt-2 flex items-center justify-center gap-1.5">
            <Coins className="w-4 h-4 text-primary" />
            You have{' '}
            <span className="text-primary font-semibold">{points.toLocaleString()}</span> points to
            spend
          </p>
        ) : (
          <p className="text-muted mt-2">
            <a href="/api/auth/discord/login?return_to=/rewards" className="text-primary hover:underline">
              Login with Discord
            </a>{' '}
            to earn points from daily check-ins, purchases, and achievements
          </p>
        )}
      </div>

      {message && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            message.kind === 'ok'
              ? 'border-primary/40 bg-primary/10 text-white'
              : 'border-red-500/40 bg-red-500/10 text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {REWARDS.map((reward) => {
          const affordable = points >= reward.cost;
          return (
            <div
              key={reward.id}
              className="rounded-xl border border-border bg-card/60 p-5 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-white">{reward.name}</p>
                <p className="text-sm text-muted mt-0.5">{reward.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-primary mb-2">
                  {reward.cost.toLocaleString()} pts
                </p>
                <button
                  type="button"
                  disabled={!loggedIn || !affordable || redeem.isPending}
                  onClick={() => handleRedeem(reward.id, reward.name)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer bg-primary text-background hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {redeem.isPending ? 'Redeeming…' : 'Redeem'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-card/40 p-5 text-sm text-muted space-y-2">
        <p className="font-semibold text-white">How to earn points</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Check in daily — 10 points, growing with your streak (up to 80/day)</li>
          <li>Shop purchases — 5 points back per $1 spent</li>
          <li>Unlock achievements — 25 to 500 points each</li>
          <li>Complete weekly challenges — 50 to 150 points each</li>
          <li>
            Recruit friends — 250 points when they make their first purchase (link on your profile)
          </li>
        </ul>
        <p className="pt-2 text-xs">
          You can also redeem rewards directly on the{' '}
          <Link href="/shop" className="text-primary hover:underline">
            shop page
          </Link>
          .
        </p>
      </div>
    </>
  );
}
