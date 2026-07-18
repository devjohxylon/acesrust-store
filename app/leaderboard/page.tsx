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
    <div className="py-8 md:py-12 pb-[max(3rem,env(safe-area-inset-bottom))]">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Standings</p>
            <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
              Leaderboard
            </h1>
            <p className="text-sm text-muted">{data.serverName}</p>
          </header>

          <LeaderboardTabs data={data} />
        </div>
      </div>
    </div>
  );
}
