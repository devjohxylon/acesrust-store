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

export type ServerStatus = {
  online: boolean;
  players: number;
  maxPlayers: number;
  queued: number;
  serverName: string | null;
  updatedAt: string | null;
};

export type ServerStatusInput = {
  online?: boolean;
  players: number;
  maxPlayers: number;
  queued?: number;
  serverName?: string | null;
};

export const EMPTY_SERVER_STATUS: ServerStatus = {
  online: false,
  players: 0,
  maxPlayers: 0,
  queued: 0,
  serverName: null,
  updatedAt: null,
};

export type PurchaseEntry = {
  id: string;
  buyer: string;
  product: string;
  amount: number;
  currency: string;
  at: string;
};

export type PurchaseInput = {
  buyer: string;
  product: string;
  amount: number;
  currency: string;
};

export type PopPoint = {
  t: string;
  players: number;
};

export const MAX_PURCHASES = 20;
export const MAX_POP_POINTS = 500;

export type WipePrizePlace = {
  title: string;
  description: string;
};

export type WipePrizesConfig = {
  enabled: boolean;
  first: WipePrizePlace;
  second: WipePrizePlace;
  third: WipePrizePlace;
};

export type WipePrizeWinner = {
  place: 1 | 2 | 3;
  discord_id: string;
  username: string;
  points: number;
};

export type WipePrizeWinnerSnapshot = {
  wipeId: string;
  wipeTitle: string;
  announcedAt: string;
  winners: WipePrizeWinner[];
};

export type WipePrizesState = {
  config: WipePrizesConfig;
  announcedWipeIds: string[];
  lastWinners: WipePrizeWinnerSnapshot | null;
};

export const DEFAULT_WIPE_PRIZES: WipePrizesConfig = {
  enabled: true,
  first: {
    title: 'Grand Prize',
    description: 'Exclusive VIP kit + Site Legend Discord role',
  },
  second: {
    title: 'Runner-Up',
    description: 'Premium shop kit of your choice',
  },
  third: {
    title: 'Third Place',
    description: '500 bonus points + 10% shop discount',
  },
};

export const DEFAULT_WIPE_PRIZES_STATE: WipePrizesState = {
  config: DEFAULT_WIPE_PRIZES,
  announcedWipeIds: [],
  lastWinners: null,
};
