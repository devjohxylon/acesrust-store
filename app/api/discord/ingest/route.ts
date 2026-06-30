import { NextResponse } from 'next/server';
import {
  syncLeaderboardFromDiscord,
  verifyDiscordIngestSecret,
  type DiscordIngestPayload,
} from '@/lib/discord-ingest';

export async function POST(request: Request) {
  const auth = verifyDiscordIngestSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: DiscordIngestPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.type !== 'leaderboard') {
    return NextResponse.json({ ok: true, ignored: body.type ?? 'unknown' });
  }

  try {
    const leaderboard = await syncLeaderboardFromDiscord(body);
    return NextResponse.json({
      ok: true,
      imageUrl: leaderboard.kaosImageUrl,
      updatedAt: leaderboard.updatedAt,
      discordMessageId: leaderboard.discordMessageId,
    });
  } catch (error) {
    console.error('Discord ingest failed:', error);
    const message = error instanceof Error ? error.message : 'Ingest failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
