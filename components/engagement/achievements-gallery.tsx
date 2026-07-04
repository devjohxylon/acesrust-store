'use client';

import { Award, Lock } from 'lucide-react';
import { useAchievements, useMe } from '@/hooks/use-engagement';
import type { AchievementCategory } from '@/lib/engagement/types';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  loyalty: 'Loyalty',
  supporter: 'Supporter',
  competitor: 'Competitor',
  community: 'Community',
};

function rarityLabel(rarity: number): string {
  const pct = Math.round(rarity * 100);
  if (pct === 0) return 'Nobody has this yet';
  if (pct < 5) return `Only ${pct}% of players have this`;
  return `${pct}% of players have this`;
}

export function AchievementsGallery() {
  const { data } = useAchievements();
  const { data: me } = useMe();

  const achievements = data?.achievements ?? [];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const loggedIn = Boolean(me?.user);

  const categories = ['loyalty', 'supporter', 'competitor', 'community'] as const;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Award className="w-7 h-7 text-primary" />
            Achievements
          </h1>
          {loggedIn ? (
            <p className="text-muted mt-2">
              You&apos;ve unlocked{' '}
              <span className="text-primary font-semibold">
                {unlockedCount}/{achievements.length}
              </span>{' '}
              achievements
            </p>
          ) : (
            <p className="text-muted mt-2">
              <a href="/api/auth/discord/login?return_to=/achievements" className="text-primary hover:underline">
                Login with Discord
              </a>{' '}
              to start unlocking achievements and earning points
            </p>
          )}
        </div>

        <div className="space-y-10">
          {categories.map((category) => {
            const items = achievements.filter((a) => a.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category}>
                <h2 className="text-lg font-bold mb-4">{CATEGORY_LABELS[category]}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((a) => (
                    <div
                      key={a.id}
                      className={`rounded-xl border p-4 flex items-start gap-4 ${
                        a.unlocked
                          ? 'bg-gradient-card border-primary/40'
                          : 'bg-card/40 border-border'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                          a.unlocked ? 'bg-primary/15' : 'bg-border/40 grayscale opacity-50'
                        }`}
                      >
                        {a.unlocked ? a.icon : <Lock className="w-5 h-5 text-muted" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-semibold ${a.unlocked ? 'text-white' : 'text-foreground/70'}`}>
                            {a.name}
                          </p>
                          <span className="text-xs font-bold text-primary">+{a.points} pts</span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">{a.description}</p>
                        <p className="text-[11px] text-muted/70 mt-1.5">{rarityLabel(a.rarity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
