'use client';

import Link from 'next/link';
import { CheckCircle2, Target } from 'lucide-react';
import { useChallenges, useMe } from '@/hooks/use-engagement';

export function ChallengeStrip() {
  const { data: challengesData } = useChallenges();
  const { data: me } = useMe();

  const challenges = challengesData?.challenges ?? [];
  if (challenges.length === 0) return null;

  const loggedIn = Boolean(me?.user);

  return (
    <section className="py-8 relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Weekly Challenges
            </h2>
            {!loggedIn && (
              <a
                href="/api/auth/discord/login?return_to=/"
                className="text-xs text-primary hover:underline"
              >
                Login to track progress
              </a>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

          {loggedIn && (
            <p className="text-xs text-muted mt-3">
              Progress updates automatically as you check in and shop.{' '}
              <Link href="/rewards" className="text-primary hover:underline">
                Spend your points →
              </Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
