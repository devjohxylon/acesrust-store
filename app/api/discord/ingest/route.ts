import { NextResponse } from 'next/server';
import {
  syncLeaderboardFromDiscord,
  verifyDiscordIngestSecret,
  type DiscordIngestPayload,
} from '@/lib/discord-ingest';
import { saveServerStatus } from '@/lib/cms-service';

export async function POST(request: Request) {
  const auth = verifyDiscordIngestSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: DiscordIngestPayload & {
    players?: number;
    maxPlayers?: number;
    queued?: number;
    online?: boolean;
    serverName?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    if (body.type === 'leaderboard') {
      const leaderboard = await syncLeaderboardFromDiscord(body);
      return NextResponse.json({
        ok: true,
        type: 'leaderboard',
        updatedAt: leaderboard.updatedAt,
        discordMessageId: leaderboard.discordMessageId,
      });
    }

    if (body.type === 'server_status') {
      if (typeof body.players !== 'number' || typeof body.maxPlayers !== 'number') {
        return NextResponse.json(
          { error: 'server_status requires numeric players and maxPlayers' },
          { status: 400 }
        );
      }
      const server = await saveServerStatus({
        players: body.players,
        maxPlayers: body.maxPlayers,
        queued: body.queued,
        online: body.online,
        serverName: body.serverName,
      });
      return NextResponse.json({ ok: true, type: 'server_status', server });
    }

    return NextResponse.json({ ok: true, ignored: body.type ?? 'unknown' });
  } catch (error) {
    console.error('Discord ingest failed:', error);
    const message = error instanceof Error ? error.message : 'Ingest failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
