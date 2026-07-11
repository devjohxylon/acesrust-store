'use client';

import { useState } from 'react';
import { Trophy, Zap } from 'lucide-react';
import type { LeaderboardData } from '@/lib/leaderboard-data';
import { LeaderboardBoard } from '@/components/leaderboard/leaderboard-board';
import { PointsRace } from '@/components/engagement/points-race';
import { ServerActivityPanel } from '@/components/server/server-activity-panel';

type Tab = 'stats' | 'points';

type Props = {
  data: LeaderboardData;
};

export function LeaderboardTabs({ data }: Props) {
  const [tab, setTab] = useState<Tab>('stats');

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-lg border border-border bg-card p-1 gap-1">
        <button
          type="button"
          onClick={() => setTab('stats')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            tab === 'stats'
              ? 'bg-primary text-background'
              : 'text-muted hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          In-Game
        </button>
        <button
          type="button"
          onClick={() => setTab('points')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            tab === 'points'
              ? 'bg-primary text-background'
              : 'text-muted hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          Points Race
        </button>
      </div>

      {tab === 'stats' ? (
        <div className="space-y-8">
          <LeaderboardBoard data={data} />
          <ServerActivityPanel variant="full" />
        </div>
      ) : (
        <PointsRace />
      )}
    </div>
  );
}
