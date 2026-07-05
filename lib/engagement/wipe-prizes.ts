import 'server-only';

import {
  getAllWipes,
  getWipePrizesState,
  markWipePrizesAnnounced,
} from '@/lib/cms-service';
import type { WipePrizeWinner, WipePrizeWinnerSnapshot, WipeSchedule } from '@/lib/cms-types';
import { postToFeedChannel } from '@/lib/engagement/discord';
import { engagementDb } from '@/lib/engagement/db';
import { getSeasonLeaderboardBetween } from '@/lib/engagement/service';

const MEDALS = ['🥇', '🥈', '🥉'] as const;
const LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000;

function monthStartUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function seasonSinceForWipe(
  wipe: WipeSchedule,
  pastWipes: WipeSchedule[]
): Date {
  const previous = pastWipes
    .filter((w) => new Date(w.scheduledAt).getTime() < new Date(wipe.scheduledAt).getTime())
    .reduce<WipeSchedule | null>(
      (latest, current) =>
        !latest || new Date(current.scheduledAt).getTime() > new Date(latest.scheduledAt).getTime()
          ? current
          : latest,
      null
    );

  if (previous) return new Date(previous.scheduledAt);
  return monthStartUtc(new Date(wipe.scheduledAt));
}

async function addWinnerFeedEvents(snapshot: WipePrizeWinnerSnapshot): Promise<void> {
  const db = engagementDb();
  for (const winner of snapshot.winners) {
    await db.from('activity_events').insert({
      discord_id: winner.discord_id,
      type: 'wipe_prize',
      message: `finished ${MEDALS[winner.place - 1]} in the Points Race for ${snapshot.wipeTitle}`,
    });
  }
}

async function announceSnapshot(
  wipe: WipeSchedule,
  since: Date,
  until: Date
): Promise<WipePrizeWinnerSnapshot | null> {
  const state = await getWipePrizesState();
  if (!state.config.enabled) return null;
  if (state.announcedWipeIds.includes(wipe.id)) return null;

  const board = await getSeasonLeaderboardBetween(since, until, null, 3);
  const places = [
    { place: 1 as const, prize: state.config.first },
    { place: 2 as const, prize: state.config.second },
    { place: 3 as const, prize: state.config.third },
  ];

  const winners: WipePrizeWinner[] = places
    .map(({ place }) => {
      const entry = board.top[place - 1];
      if (!entry) return null;
      return {
        place,
        discord_id: entry.discord_id,
        username: entry.username,
        points: entry.points,
      };
    })
    .filter((w): w is WipePrizeWinner => w !== null);

  const snapshot: WipePrizeWinnerSnapshot = {
    wipeId: wipe.id,
    wipeTitle: wipe.title,
    announcedAt: new Date().toISOString(),
    winners,
  };

  await markWipePrizesAnnounced(wipe.id, snapshot);

  if (winners.length === 0) {
    await postToFeedChannel(
      `🏁 **Points Race — ${wipe.title}**\nNo winners this wipe — nobody earned points during the season.`
    );
    return snapshot;
  }

  const lines = winners.map((winner, index) => {
    const prize = places[index].prize;
    return (
      `${MEDALS[winner.place - 1]} **${winner.username}** — ${winner.points.toLocaleString()} pts\n` +
      `   *${prize.title}:* ${prize.description}`
    );
  });

  await postToFeedChannel(`🏆 **Points Race — ${wipe.title} Winners**\n\n${lines.join('\n\n')}`);
  await addWinnerFeedEvents(snapshot);

  return snapshot;
}

export async function announceWipeWinners(
  wipeId: string
): Promise<WipePrizeWinnerSnapshot | null> {
  const wipes = (await getAllWipes()).filter((w) => w.isPublished);
  const wipe = wipes.find((w) => w.id === wipeId);
  if (!wipe) throw new Error('Wipe not found');

  const now = Date.now();
  if (new Date(wipe.scheduledAt).getTime() > now) {
    throw new Error('Wipe has not happened yet');
  }

  const pastWipes = wipes.filter((w) => new Date(w.scheduledAt).getTime() <= now);
  const since = seasonSinceForWipe(wipe, pastWipes);
  const until = new Date(wipe.scheduledAt);

  return announceSnapshot(wipe, since, until);
}

/** Finds published wipes that ended recently and haven't been announced yet. */
export async function processPendingWipePrizes(
  now = new Date()
): Promise<{ processed: string[]; snapshots: WipePrizeWinnerSnapshot[] }> {
  const state = await getWipePrizesState();
  if (!state.config.enabled) {
    return { processed: [], snapshots: [] };
  }

  const wipes = (await getAllWipes()).filter((w) => w.isPublished);
  const nowMs = now.getTime();
  const pastWipes = wipes
    .filter((w) => {
      const at = new Date(w.scheduledAt).getTime();
      return at <= nowMs && at >= nowMs - LOOKBACK_MS;
    })
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const processed: string[] = [];
  const snapshots: WipePrizeWinnerSnapshot[] = [];

  for (const wipe of pastWipes) {
    if (state.announcedWipeIds.includes(wipe.id)) continue;

    const since = seasonSinceForWipe(wipe, wipes.filter((w) => new Date(w.scheduledAt).getTime() <= nowMs));
    const until = new Date(wipe.scheduledAt);
    const snapshot = await announceSnapshot(wipe, since, until);
    if (snapshot) {
      processed.push(wipe.id);
      snapshots.push(snapshot);
      state.announcedWipeIds.push(wipe.id);
    }
  }

  return { processed, snapshots };
}

export async function announceLatestPendingWipe(): Promise<WipePrizeWinnerSnapshot | null> {
  const state = await getWipePrizesState();
  const now = new Date();
  const wipes = (await getAllWipes())
    .filter((w) => w.isPublished && new Date(w.scheduledAt).getTime() <= now.getTime())
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  for (const wipe of wipes) {
    if (state.announcedWipeIds.includes(wipe.id)) continue;
    return announceWipeWinners(wipe.id);
  }

  return null;
}
