'use client';

import { useState } from 'react';
import type { LeaderboardData } from '@/lib/leaderboard-data';
import { LeaderboardBoard } from '@/components/leaderboard/leaderboard-board';
import { PointsRace } from '@/components/engagement/points-race';
import { ServerActivityPanel } from '@/components/server/server-activity-panel';

type Tab = 'stats' | 'points';

type Props = {
  data: LeaderboardData;
};

const TABS: { id: Tab; label: string }[] = [
  { id: 'stats', label: 'In-game' },
  { id: 'points', label: 'Points race' },
];

export function LeaderboardTabs({ data }: Props) {
  const [tab, setTab] = useState<Tab>('stats');

  return (
    <div className="space-y-6">
      <div
        className="flex gap-6 border-b border-border"
        role="tablist"
        aria-label="Leaderboard views"
      >
        {TABS.map(({ id, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={`relative pb-2.5 text-sm transition-colors cursor-pointer touch-manipulation ${
                active ? 'text-white' : 'text-muted hover:text-foreground'
              }`}
            >
              {label}
              {active ? (
                <span className="absolute inset-x-0 -bottom-px h-px bg-primary" />
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === 'stats' ? (
        <div className="space-y-5">
          <LeaderboardBoard data={data} />
          <ServerActivityPanel variant="full" />
        </div>
      ) : (
        <PointsRace />
      )}
    </div>
  );
}
