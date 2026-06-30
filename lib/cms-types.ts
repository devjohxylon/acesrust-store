import type { LeaderboardData, LeaderboardEntry } from '@/lib/leaderboard-data';

export type LeaderboardCategory = 'killers' | 'survivors' | 'victims';

export type WipeType = 'map' | 'blueprint' | 'full';

export type WipeSchedule = {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  wipeType: WipeType;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LeaderboardPayload = LeaderboardData;

export type LeaderboardUpdateInput = {
  serverName: string;
  totalKills: number;
  topKillers: LeaderboardEntry[];
  topSurvivors: LeaderboardEntry[];
  topVictims: LeaderboardEntry[];
};

export type WipeScheduleInput = {
  title: string;
  description?: string | null;
  scheduledAt: string;
  wipeType: WipeType;
  isPublished: boolean;
};

export const WIPE_TYPE_LABELS: Record<WipeType, string> = {
  map: 'Map Wipe',
  blueprint: 'Blueprint Wipe',
  full: 'Full Wipe',
};
