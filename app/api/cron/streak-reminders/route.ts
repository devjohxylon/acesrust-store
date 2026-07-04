import { NextRequest, NextResponse } from 'next/server';
import { isEngagementConfigured } from '@/lib/engagement/db';
import { isDiscordBotConfigured, sendDirectMessage } from '@/lib/engagement/discord';
import { getStreakReminderCandidates } from '@/lib/engagement/service';
import { safeCompare } from '@/lib/security';
import { config } from '@/lib/config';

export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') ?? '';
  return safeCompare(header, `Bearer ${secret}`);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isEngagementConfigured() || !isDiscordBotConfigured()) {
    return NextResponse.json({ ok: true, skipped: 'not configured' });
  }

  const candidates = await getStreakReminderCandidates(new Date());
  let sent = 0;

  for (const player of candidates) {
    const ok = await sendDirectMessage(
      player.discord_id,
      `🔥 Your **${player.streak_count}-day** check-in streak on ${config.app.siteUrl} ` +
        `expires at midnight UTC! Visit the site to keep it alive and collect your points.`
    );
    if (ok) sent += 1;
  }

  return NextResponse.json({ ok: true, candidates: candidates.length, sent });
}
