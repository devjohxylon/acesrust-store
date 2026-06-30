import type { LeaderboardData } from '@/lib/leaderboard-data';
import type {
  LeaderboardUpdateInput,
  WipeSchedule,
  WipeScheduleInput,
} from '@/lib/cms-types';
import { readCmsData, writeCmsData } from '@/lib/cms-store';

function formatUpdatedAt(iso: string) {
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)} UTC`;
}

function sortByScheduled(a: WipeSchedule, b: WipeSchedule) {
  return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
}

export async function getLeaderboard(): Promise<LeaderboardData> {
  const { leaderboard } = await readCmsData();
  return leaderboard;
}

export async function saveLeaderboard(input: LeaderboardUpdateInput): Promise<void> {
  const data = await readCmsData();

  data.leaderboard = {
    ...data.leaderboard,
    serverName: input.serverName.trim(),
    totalKills: input.totalKills,
    updatedAt: formatUpdatedAt(new Date().toISOString()),
    topKillers: input.topKillers,
    topSurvivors: input.topSurvivors,
    topVictims: input.topVictims,
  };

  await writeCmsData(data);
}

export async function getPublishedWipes(): Promise<WipeSchedule[]> {
  const { wipes } = await readCmsData();
  const now = Date.now();
  return wipes
    .filter((wipe) => wipe.isPublished && new Date(wipe.scheduledAt).getTime() >= now)
    .sort(sortByScheduled);
}

export async function getAllWipes(): Promise<WipeSchedule[]> {
  const { wipes } = await readCmsData();
  return [...wipes].sort(sortByScheduled);
}

export async function createWipe(input: WipeScheduleInput): Promise<WipeSchedule> {
  const data = await readCmsData();
  const now = new Date().toISOString();

  const wipe: WipeSchedule = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    description: input.description?.trim() || null,
    scheduledAt: input.scheduledAt,
    wipeType: input.wipeType,
    isPublished: input.isPublished,
    createdAt: now,
    updatedAt: now,
  };

  data.wipes.push(wipe);
  await writeCmsData(data);
  return wipe;
}

export async function updateWipe(id: string, input: WipeScheduleInput): Promise<WipeSchedule> {
  const data = await readCmsData();
  const index = data.wipes.findIndex((wipe) => wipe.id === id);
  if (index === -1) throw new Error('Wipe not found');

  const updated: WipeSchedule = {
    ...data.wipes[index],
    title: input.title.trim(),
    description: input.description?.trim() || null,
    scheduledAt: input.scheduledAt,
    wipeType: input.wipeType,
    isPublished: input.isPublished,
    updatedAt: new Date().toISOString(),
  };

  data.wipes[index] = updated;
  await writeCmsData(data);
  return updated;
}

export async function deleteWipe(id: string): Promise<void> {
  const data = await readCmsData();
  data.wipes = data.wipes.filter((wipe) => wipe.id !== id);
  await writeCmsData(data);
}
