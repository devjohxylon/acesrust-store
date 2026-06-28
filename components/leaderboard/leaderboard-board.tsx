import type { LeaderboardData, LeaderboardEntry } from '@/lib/leaderboard-data';

type LeaderboardBoardProps = {
  data: LeaderboardData;
};

function rankClass(rank: number) {
  if (rank === 1) return 'text-yellow-400';
  if (rank === 2) return 'text-gray-300';
  if (rank === 3) return 'text-amber-600';
  return 'text-foreground/90';
}

function LeaderboardTable({
  title,
  titleClass,
  headerLabel,
  entries,
  emptyMessage,
}: {
  title: string;
  titleClass: string;
  headerLabel: string;
  entries: LeaderboardEntry[];
  emptyMessage?: string;
}) {
  return (
    <div className="flex flex-col min-h-0">
      <h3 className={`text-sm font-bold tracking-wide mb-3 ${titleClass}`}>
        « {title} »
      </h3>
      <div className="grid grid-cols-[2rem_1fr_3rem] gap-x-2 text-[11px] sm:text-xs font-mono text-sky-400/90 mb-1 px-1">
        <span>Rank</span>
        <span>Player</span>
        <span className="text-right">{headerLabel}</span>
      </div>
      <div className="border-t border-primary/30 mb-2" />
      {entries.length === 0 ? (
        <p className="text-xs font-mono text-muted px-1 py-4">
          {emptyMessage ?? 'No data yet'}
        </p>
      ) : (
        <ul className="space-y-0.5">
          {entries.map((entry) => (
            <li
              key={`${title}-${entry.rank}-${entry.player}`}
              className="grid grid-cols-[2rem_1fr_3rem] gap-x-2 text-[11px] sm:text-xs font-mono px-1 py-0.5 rounded hover:bg-white/5"
            >
              <span className={rankClass(entry.rank)}>{entry.rank}</span>
              <span className={`truncate ${rankClass(entry.rank)}`}>{entry.player}</span>
              <span className={`text-right ${rankClass(entry.rank)}`}>{entry.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LeaderboardBoard({ data }: LeaderboardBoardProps) {
  return (
    <div className="rounded-xl border border-border bg-[#1a1a1a] overflow-hidden shadow-2xl">
      <div className="px-4 sm:px-6 py-4 border-b border-white/10 bg-black/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-bold font-mono text-white tracking-tight">
            {data.serverName}
          </h2>
          <p className="text-sm font-mono">
            <span className="text-muted">Total Kills: </span>
            <span className="text-sky-400 font-semibold">{data.totalKills}</span>
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          <LeaderboardTable
            title="TOP KILLERS"
            titleClass="text-primary"
            headerLabel="Kills"
            entries={data.topKillers}
          />

          <div className="flex flex-col gap-8">
            <LeaderboardTable
              title="TOP SURVIVORS (K/D)"
              titleClass="text-sky-400"
              headerLabel="K/D"
              entries={data.topSurvivors}
              emptyMessage="No survivors ranked yet"
            />
            <LeaderboardTable
              title="TOP VICTIMS"
              titleClass="text-orange-400"
              headerLabel="Deaths"
              entries={data.topVictims}
            />
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-3 border-t border-white/10 bg-black/20">
        <p className="text-[10px] sm:text-xs font-mono text-muted text-center">
          {data.updatedAt}
        </p>
      </div>
    </div>
  );
}
