import type { Metadata } from 'next';
import { LeaderboardTabs } from '@/components/leaderboard/leaderboard-tabs';
import { getLeaderboard } from '@/lib/cms-service';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: `Leaderboard | ${siteConfig.name}`,
  description: 'Top killers, survivors, victims, and the seasonal points race.',
};

export const revalidate = 60;

export default async function LeaderboardPage() {
  const data = await getLeaderboard();

  return (
    <div className="min-h-screen py-12 md:py-16">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Leaderboard</h1>
            <p className="text-muted">Live stats from {data.serverName}</p>
          </div>

          <LeaderboardTabs data={data} />
        </div>
      </div>
    </div>
  );
}
