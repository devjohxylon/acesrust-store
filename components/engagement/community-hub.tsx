'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Activity, Target, Zap } from 'lucide-react';
import { ChallengeStrip } from '@/components/engagement/challenge-strip';
import { ActivityFeed } from '@/components/engagement/activity-feed';
import { PointsRace } from '@/components/engagement/points-race';
import { PageShell } from '@/components/layout/page-shell';

type Tab = 'race' | 'challenges' | 'activity';

export function CommunityHub() {
  const [tab, setTab] = useState<Tab>('race');

  const tabs: { id: Tab; label: string; icon: typeof Zap }[] = [
    { id: 'race', label: 'Points Race', icon: Zap },
    { id: 'challenges', label: 'Challenges', icon: Target },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <PageShell
      title="Community"
      description="Earn points, complete weekly challenges, and compete each wipe."
      width="xl"
    >
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === id
                ? 'bg-primary text-background'
                : 'text-muted hover:text-white bg-card border border-border'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
        <Link
          href="/rewards"
          className="ml-auto inline-flex items-center gap-1 text-sm text-primary hover:underline self-center"
        >
          Rewards store
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div>
        {tab === 'race' && <PointsRace />}
        {tab === 'challenges' && <ChallengeStrip embedded />}
        {tab === 'activity' && <ActivityFeed embedded />}
      </div>
    </PageShell>
  );
}
