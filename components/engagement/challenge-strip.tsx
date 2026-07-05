'use client';

import Link from 'next/link';
import { CheckCircle2, Target } from 'lucide-react';
import { useChallenges, useMe } from '@/hooks/use-engagement';

type Props = {
  embedded?: boolean;
};

export function ChallengeStrip({ embedded = false }: Props) {
  const { data: challengesData } = useChallenges();
  const { data: me } = useMe();

  const challenges = challengesData?.challenges ?? [];
  const loggedIn = Boolean(me?.user);

  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Weekly Challenges
        </h2>
        {!loggedIn && (
          <a
            href="/api/auth/discord/login?return_to=/community"
            className="text-xs text-primary hover:underline"
          >
            Login to track
          </a>
        )}
      </div>

      {challenges.length === 0 ? (
        <p className="text-sm text-muted rounded-xl border border-border bg-card/40 px-4 py-6 text-center">
          No active challenges right now. Check back soon.
        </p>
      ) : (
        <div className={`grid gap-3 ${embedded ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {challenges.map((challenge) => {
            const pct = Math.min(100, Math.round((challenge.progress / challenge.goal) * 100));
            return (
              <div
                key={challenge.id}
                className={`rounded-xl border p-4 bg-card/60 backdrop-blur ${
                  challenge.completed ? 'border-primary/50' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{challenge.title}</p>
                  <span className="text-xs font-bold text-primary whitespace-nowrap">
                    +{challenge.points} pts
                  </span>
                </div>
                {challenge.description && (
                  <p className="text-xs text-muted mt-1">{challenge.description}</p>
                )}
                <div className="mt-3">
                  {challenge.completed ? (
                    <p className="text-xs text-primary font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
                    </p>
                  ) : (
                    <>
                      <div className="h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full gradient-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-muted mt-1.5">
                        {challenge.progress} / {challenge.goal}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loggedIn && challenges.length > 0 && (
        <p className="text-xs text-muted mt-3">
          Progress updates as you check in and shop.{' '}
          <Link href="/rewards" className="text-primary hover:underline">
            Spend points →
          </Link>
        </p>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <section className="py-8 relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">{content}</div>
      </div>
    </section>
  );
}
