import type { Metadata } from 'next';
import { LeaderboardBoard } from '@/components/leaderboard/leaderboard-board';
import { getLeaderboard } from '@/lib/cms-service';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: `Leaderboard | ${siteConfig.name}`,
  description: 'Top killers, survivors, and victims on Aces Vanilla+ Rust Console.',
};

export default async function LeaderboardPage() {
  const data = await getLeaderboard();

  return (
    <div className="min-h-screen py-12 md:py-16">
      <div className="absolute inset-0 grid-pattern opacity-15 pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Leaderboard
            </h1>
            <p className="text-muted">
              Live stats from {data.serverName}
            </p>
          </div>

          <LeaderboardBoard data={data} />
        </div>
      </div>
    </div>
  );
}
