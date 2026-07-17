export type LeaderboardEntry = {
  rank: number;
  player: string;
  value: number;
};

export type LeaderboardData = {
  serverName: string;
  totalKills: number;
  updatedAt: string;
  topKillers: LeaderboardEntry[];
  topSurvivors: LeaderboardEntry[];
  topVictims: LeaderboardEntry[];
  /** KAOS leaderboard screenshot synced from Discord (public fallback URL, e.g. local dev) */
  kaosImageUrl?: string | null;
  /** Blob pathname of the private KAOS screenshot, served via /api/leaderboard/image */
  kaosImagePathname?: string | null;
  discordMessageId?: string | null;
};

/** Placeholder data — replace with live KAOS feed when available */
export const placeholderLeaderboard: LeaderboardData = {
  serverName: '[S] 1 | Astral Vanilla+',
  totalKills: 564,
  updatedAt: '2026-06-28 15:39:24 UTC',
  topKillers: [
    { rank: 1, player: 'lilman72pink 5', value: 26 },
    { rank: 2, player: 'Silentghost7117', value: 17 },
    { rank: 3, player: 'IsneezeYT', value: 16 },
    { rank: 4, player: 'Cursihnn', value: 14 },
    { rank: 5, player: 'MyGameWasFree', value: 14 },
    { rank: 6, player: 'sulfuryrun', value: 13 },
    { rank: 7, player: 'OT-RedCard', value: 13 },
    { rank: 8, player: 'Exit Pebbles', value: 12 },
    { rank: 9, player: 'XpIZZARoLLs3', value: 12 },
    { rank: 10, player: 'BURNTDORITO', value: 12 },
    { rank: 11, player: 'y3qf', value: 12 },
    { rank: 12, player: 'I beam u 777', value: 12 },
    { rank: 13, player: 'crowd dark113 YT', value: 11 },
    { rank: 14, player: 'Taterbeans9', value: 11 },
    { rank: 15, player: 'GHOSTY144', value: 11 },
  ],
  topSurvivors: [],
  topVictims: [
    { rank: 1, player: 'Simoniac39', value: 37 },
    { rank: 2, player: 'Raccoon 1231163', value: 17 },
    { rank: 3, player: 'CyborgMonkey654', value: 17 },
    { rank: 4, player: 'FearlessDers', value: 16 },
    { rank: 5, player: 'Fudjepacker', value: 12 },
  ],
};
