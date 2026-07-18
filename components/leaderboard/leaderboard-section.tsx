import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LeaderboardBoard } from '@/components/leaderboard/leaderboard-board';
import { getLeaderboard } from '@/lib/cms-service';

type LeaderboardSectionProps = {
  showViewAll?: boolean;
};

export async function LeaderboardSection({ showViewAll = true }: LeaderboardSectionProps) {
  const data = await getLeaderboard();

  return (
    <section className="py-12 md:py-16 relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 space-y-1.5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Standings</p>
            <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
              Leaderboard
            </h2>
            <p className="text-sm text-muted max-w-xl">
              Top killers, survivors, and victims — synced from in-game stats.
            </p>
          </div>

          <LeaderboardBoard data={data} />

          {showViewAll && (
            <div className="mt-5">
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 text-sm text-muted hover:text-white transition-colors"
              >
                Full leaderboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
