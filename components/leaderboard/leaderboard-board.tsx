'use client';

import { motion } from 'framer-motion';
import type { LeaderboardData, LeaderboardEntry } from '@/lib/leaderboard-data';

type LeaderboardBoardProps = {
  data: LeaderboardData;
};

function rankTone(rank: number) {
  if (rank === 1) return 'text-white';
  if (rank === 2) return 'text-foreground/90';
  if (rank === 3) return 'text-foreground/80';
  return 'text-muted';
}

function LeaderboardTable({
  title,
  headerLabel,
  entries,
  emptyMessage,
}: {
  title: string;
  headerLabel: string;
  entries: LeaderboardEntry[];
  emptyMessage?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
          {title}
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-muted/70">{headerLabel}</span>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-muted/80 py-6">{emptyMessage ?? 'No data yet'}</p>
      ) : (
        <motion.ul
          className="divide-y divide-border/70"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ show: { transition: { staggerChildren: 0.03 } } }}
        >
          {entries.map((entry) => (
            <motion.li
              key={`${title}-${entry.rank}-${entry.player}`}
              variants={{
                hidden: { opacity: 0, y: 6 },
                show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
              }}
              className="grid grid-cols-[2rem_1fr_auto] gap-x-3 items-center py-2 text-sm"
            >
              <span className={`font-mono text-xs tabular-nums ${rankTone(entry.rank)}`}>
                {String(entry.rank).padStart(2, '0')}
              </span>
              <span className={`truncate ${entry.rank <= 3 ? 'text-white' : 'text-foreground/85'}`}>
                {entry.player}
              </span>
              <span className="font-mono text-xs tabular-nums text-primary/90">{entry.value}</span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}

export function LeaderboardBoard({ data }: LeaderboardBoardProps) {
  const kaosImageSrc = data.kaosImagePathname
    ? `/api/leaderboard/image?v=${encodeURIComponent(data.updatedAt)}`
    : data.kaosImageUrl ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }}
      className="rounded-lg border border-border bg-card/50 overflow-hidden"
    >
      <div className="px-4 sm:px-5 py-3.5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted mb-0.5">In-game</p>
          <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
            {data.serverName}
          </h2>
        </div>
        <p className="text-xs text-muted">
          Total kills{' '}
          <span className="font-mono text-sm text-white tabular-nums">{data.totalKills}</span>
        </p>
      </div>

      <div className="p-4 sm:p-5">
        {kaosImageSrc ? (
          <div className="space-y-3">
            <div className="relative mx-auto max-w-xl overflow-hidden rounded-md border border-border/80 bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={kaosImageSrc}
                alt={`${data.serverName} leaderboard`}
                className="w-full h-auto max-h-[28rem] object-contain object-top"
              />
            </div>
            <p className="text-[11px] text-muted text-center">Synced from KAOS</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            <LeaderboardTable title="Top killers" headerLabel="Kills" entries={data.topKillers} />
            <div className="flex flex-col gap-8">
              <LeaderboardTable
                title="Top survivors"
                headerLabel="K/D"
                entries={data.topSurvivors}
                emptyMessage="No survivors ranked yet"
              />
              <LeaderboardTable title="Top victims" headerLabel="Deaths" entries={data.topVictims} />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 sm:px-5 py-2.5 border-t border-border">
        <p className="text-[10px] text-muted/80 text-center font-mono">{data.updatedAt}</p>
      </div>
    </motion.div>
  );
}
