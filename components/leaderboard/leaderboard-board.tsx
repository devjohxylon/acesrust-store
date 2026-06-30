'use client';

import { motion } from 'framer-motion';
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
        <motion.ul
          className="space-y-0.5"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        >
          {entries.map((entry) => (
            <motion.li
              key={`${title}-${entry.rank}-${entry.player}`}
              variants={{
                hidden: { opacity: 0, x: -12 },
                show: { opacity: 1, x: 0, transition: { duration: 0.35 } },
              }}
              className="grid grid-cols-[2rem_1fr_3rem] gap-x-2 text-[11px] sm:text-xs font-mono px-1 py-0.5 rounded hover:bg-white/5 transition-colors"
            >
              <span className={rankClass(entry.rank)}>{entry.rank}</span>
              <span className={`truncate ${rankClass(entry.rank)}`}>{entry.player}</span>
              <span className={`text-right ${rankClass(entry.rank)}`}>{entry.value}</span>
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
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
      className="relative rounded-xl border border-primary/20 bg-[#1a1a1a] overflow-hidden shadow-2xl glow-primary"
    >
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
        {kaosImageSrc ? (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={kaosImageSrc}
              alt={`${data.serverName} leaderboard`}
              className="w-full h-auto rounded-lg border border-white/10"
            />
            <p className="text-[10px] sm:text-xs font-mono text-muted text-center">
              Live stats from KAOS — synced from Discord
            </p>
          </motion.div>
        ) : (
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
        )}
      </div>

      <div className="px-4 sm:px-6 py-3 border-t border-white/10 bg-black/20">
        <p className="text-[10px] sm:text-xs font-mono text-muted text-center">
          {data.updatedAt}
        </p>
      </div>
    </motion.div>
  );
}
