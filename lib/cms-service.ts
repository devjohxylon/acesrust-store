import type { LeaderboardData } from '@/lib/leaderboard-data';
import { brandifyText } from '@/lib/branding';
import {
  MAX_POP_POINTS,
  MAX_PURCHASES,
  type LeaderboardUpdateInput,
  type PopPoint,
  type PurchaseEntry,
  type PurchaseInput,
  type ServerStatus,
  type ServerStatusInput,
  type WipePrizesConfig,
  type WipePrizesState,
  type WipeSchedule,
  type WipeScheduleInput,
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
  return {
    ...leaderboard,
    serverName: brandifyText(leaderboard.serverName || 'Astral Vanilla+'),
  };
}

export async function saveLeaderboard(input: LeaderboardUpdateInput): Promise<void> {
  const data = await readCmsData();

  data.leaderboard = {
    ...data.leaderboard,
    serverName: brandifyText(input.serverName.trim()),
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

export async function getServerStatus(): Promise<ServerStatus> {
  const { server } = await readCmsData();
  return server;
}

export async function saveServerStatus(input: ServerStatusInput): Promise<ServerStatus> {
  const data = await readCmsData();
  const players = Math.max(0, Math.round(input.players));
  const maxPlayers = Math.max(0, Math.round(input.maxPlayers));
  const now = new Date().toISOString();

  data.server = {
    online: input.online ?? true,
    players,
    maxPlayers,
    queued: Math.max(0, Math.round(input.queued ?? 0)),
    serverName: brandifyText(input.serverName?.trim() || data.server.serverName || 'Astral Vanilla+'),
    updatedAt: now,
  };

  data.popHistory = [...(data.popHistory ?? []), { t: now, players }].slice(-MAX_POP_POINTS);

  await writeCmsData(data);
  return data.server;
}

export async function getPurchases(): Promise<PurchaseEntry[]> {
  const { purchases } = await readCmsData();
  return purchases;
}

export async function addPurchase(input: PurchaseInput): Promise<PurchaseEntry> {
  const data = await readCmsData();

  const entry: PurchaseEntry = {
    id: crypto.randomUUID(),
    buyer: input.buyer.trim().slice(0, 40) || 'Someone',
    product: input.product.trim().slice(0, 80) || 'a product',
    amount: Number.isFinite(input.amount) ? input.amount : 0,
    currency: input.currency.trim().slice(0, 8) || 'USD',
    at: new Date().toISOString(),
  };

  data.purchases = [entry, ...(data.purchases ?? [])].slice(0, MAX_PURCHASES);
  await writeCmsData(data);
  return entry;
}

export async function getPopHistory(hours = 24): Promise<PopPoint[]> {
  const { popHistory } = await readCmsData();
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return (popHistory ?? []).filter((point) => new Date(point.t).getTime() >= cutoff);
}

export async function getWipePrizesState(): Promise<WipePrizesState> {
  const { wipePrizes } = await readCmsData();
  return wipePrizes;
}

export async function saveWipePrizesConfig(config: WipePrizesConfig): Promise<WipePrizesState> {
  const data = await readCmsData();
  data.wipePrizes = {
    ...data.wipePrizes,
    config: {
      enabled: Boolean(config.enabled),
      first: {
        title: config.first.title.trim(),
        description: config.first.description.trim(),
      },
      second: {
        title: config.second.title.trim(),
        description: config.second.description.trim(),
      },
      third: {
        title: config.third.title.trim(),
        description: config.third.description.trim(),
      },
    },
  };
  await writeCmsData(data);
  return data.wipePrizes;
}

export async function markWipePrizesAnnounced(
  wipeId: string,
  snapshot: WipePrizesState['lastWinners']
): Promise<WipePrizesState> {
  const data = await readCmsData();
  const announced = new Set(data.wipePrizes.announcedWipeIds);
  announced.add(wipeId);
  data.wipePrizes = {
    ...data.wipePrizes,
    announcedWipeIds: [...announced],
    lastWinners: snapshot,
  };
  await writeCmsData(data);
  return data.wipePrizes;
}
