import { put } from '@vercel/blob';
import { readCmsData, writeCmsData } from '@/lib/cms-store';
import type { LeaderboardData } from '@/lib/leaderboard-data';

export type DiscordIngestPayload = {
  type: string;
  format?: string;
  parsed?: boolean;
  primaryImageUrl?: string | null;
  images?: { url: string; name?: string | null; source?: string }[];
  leaderboards?: unknown[];
  messageId?: string;
  timestamp?: string;
};

function formatUpdatedAt(iso: string) {
  const normalized = iso.includes('T') ? iso : new Date(iso).toISOString();
  return `${normalized.slice(0, 10)} ${normalized.slice(11, 19)} UTC`;
}

function resolveImageUrl(payload: DiscordIngestPayload) {
  return payload.primaryImageUrl ?? payload.images?.[0]?.url ?? null;
}

type PersistedImage = {
  pathname: string | null;
  url: string | null;
};

async function persistKaosImage(remoteUrl: string): Promise<PersistedImage> {
  // No Blob store (e.g. local dev) — fall back to the public Discord CDN URL.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { pathname: null, url: remoteUrl };
  }

  const imageRes = await fetch(remoteUrl, { cache: 'no-store' });
  if (!imageRes.ok) {
    throw new Error(`Could not download Discord image (${imageRes.status})`);
  }

  const contentType = imageRes.headers.get('content-type') ?? 'image/png';
  const extension = contentType.includes('jpeg') ? 'jpg' : 'png';
  const imageBuffer = await imageRes.arrayBuffer();
  const pathname = `leaderboard/kaos-latest.${extension}`;

  await put(pathname, imageBuffer, {
    access: 'private',
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return { pathname, url: null };
}

export async function syncLeaderboardFromDiscord(
  payload: DiscordIngestPayload
): Promise<LeaderboardData> {
  const remoteImageUrl = resolveImageUrl(payload);
  if (!remoteImageUrl) {
    throw new Error('No leaderboard image in Discord payload');
  }

  const image = await persistKaosImage(remoteImageUrl);
  const data = await readCmsData();

  data.leaderboard = {
    ...data.leaderboard,
    kaosImagePathname: image.pathname,
    kaosImageUrl: image.url,
    discordMessageId: payload.messageId ?? null,
    updatedAt: formatUpdatedAt(payload.timestamp ?? new Date().toISOString()),
  };

  await writeCmsData(data);
  return data.leaderboard;
}

export function verifyDiscordIngestSecret(request: Request) {
  const secret = process.env.WEBSITE_API_SECRET;
  if (!secret) {
    return { ok: false as const, status: 500, error: 'WEBSITE_API_SECRET not configured' };
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return { ok: false as const, status: 401, error: 'Unauthorized' };
  }

  return { ok: true as const };
}
