import { NextResponse } from 'next/server';
import { getWipePrizesState } from '@/lib/cms-service';
import { getUserSession } from '@/lib/engagement/session';
import { isEngagementConfigured } from '@/lib/engagement/db';
import { getSeasonLeaderboard } from '@/lib/engagement/service';

export async function GET() {
  if (!isEngagementConfigured()) {
    return NextResponse.json({ leaderboard: null, prizes: null, lastWinners: null });
  }

  try {
    const user = await getUserSession();
    const [leaderboard, prizeState] = await Promise.all([
      getSeasonLeaderboard(user?.id ?? null),
      getWipePrizesState().catch(() => null),
    ]);

    return NextResponse.json({
      leaderboard,
      prizes: prizeState?.config ?? null,
      lastWinners: prizeState?.lastWinners ?? null,
    });
  } catch (error) {
    console.error('Failed to load points leaderboard:', error);
    return NextResponse.json({ leaderboard: null, prizes: null, lastWinners: null });
  }
}
