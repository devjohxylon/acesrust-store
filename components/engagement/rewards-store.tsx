'use client';

import { useState } from 'react';
import { Coins, Gift } from 'lucide-react';
import { REWARDS } from '@/lib/engagement/rewards';
import { useMe, useRedeem } from '@/hooks/use-engagement';

export function RewardsStore() {
  const { data: me } = useMe();
  const redeem = useRedeem();
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const profile = me?.profile;
  const loggedIn = Boolean(me?.user);

  async function handleRedeem(rewardId: string, rewardName: string) {
    setMessage(null);
    try {
      await redeem.mutateAsync(rewardId);
      setMessage({
        kind: 'ok',
        text: `${rewardName} redeemed! The team will fulfill it shortly — check your profile for status.`,
      });
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Redemption failed',
      });
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Gift className="w-7 h-7 text-primary" />
            Rewards
          </h1>
          {loggedIn && profile ? (
            <p className="text-muted mt-2 flex items-center justify-center gap-1.5">
              <Coins className="w-4 h-4 text-primary" />
              You have{' '}
              <span className="text-primary font-semibold">
                {profile.total_points.toLocaleString()}
              </span>{' '}
              points to spend
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
            const affordable = (profile?.total_points ?? 0) >= reward.cost;
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
          </ul>
        </div>
      </div>
    </div>
  );
}
