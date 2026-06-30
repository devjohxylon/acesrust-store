import { promises as fs } from 'fs';
import path from 'path';
import { get, put } from '@vercel/blob';
import { placeholderLeaderboard, type LeaderboardData } from '@/lib/leaderboard-data';
import type { WipeSchedule } from '@/lib/cms-types';
import { getCmsBackend } from '@/lib/cms-config';

export type CmsData = {
  leaderboard: LeaderboardData;
  wipes: WipeSchedule[];
};

function defaultData(): CmsData {
  return {
    leaderboard: placeholderLeaderboard,
    wipes: [],
  };
}

const BLOB_PATHNAME = 'cms/data.json';
const dataFile = path.join(process.cwd(), '.data', 'cms.json');

// Per-instance fallback when no persistent backend is configured.
let memoryData: CmsData | null = null;

async function blobRead(): Promise<CmsData | null> {
  try {
    const result = await get(BLOB_PATHNAME, { access: 'private' });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as CmsData;
  } catch {
    return null;
  }
}

async function blobWrite(data: CmsData): Promise<void> {
  await put(BLOB_PATHNAME, JSON.stringify(data), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function fileRead(): Promise<CmsData | null> {
  try {
    const raw = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(raw) as CmsData;
  } catch {
    return null;
  }
}

async function fileWrite(data: CmsData): Promise<void> {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf8');
}

export async function readCmsData(): Promise<CmsData> {
  switch (getCmsBackend()) {
    case 'blob':
      return (await blobRead()) ?? defaultData();
    case 'file':
      return (await fileRead()) ?? defaultData();
    default:
      return memoryData ?? defaultData();
  }
}

export async function writeCmsData(data: CmsData): Promise<void> {
  switch (getCmsBackend()) {
    case 'blob':
      await blobWrite(data);
      return;
    case 'file':
      await fileWrite(data);
      return;
    default:
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'No persistent storage configured. Add a Vercel Blob store (BLOB_READ_WRITE_TOKEN) to save changes.'
        );
      }
      memoryData = data;
  }
}
