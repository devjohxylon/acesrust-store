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
    <section className="py-16 md:py-20 relative">
      <div className="absolute inset-0 grid-pattern opacity-15" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Server Leaderboard
            </h2>
            <p className="text-muted max-w-xl mx-auto">
              Top killers, survivors, and victims on Aces Vanilla+. Updated from in-game stats.
            </p>
          </div>

          <LeaderboardBoard data={data} />

          {showViewAll && (
            <div className="mt-8 text-center">
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                View full leaderboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
