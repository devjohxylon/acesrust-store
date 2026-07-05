import type { Metadata } from 'next';
import { LeaderboardTabs } from '@/components/leaderboard/leaderboard-tabs';
import { PageShell } from '@/components/layout/page-shell';
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
    <PageShell
      title="Leaderboard"
      description={`Live stats from ${data.serverName}`}
      width="xl"
    >
      <LeaderboardTabs data={data} />
    </PageShell>
  );
}
