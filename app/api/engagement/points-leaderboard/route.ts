import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/engagement/session';
import { isEngagementConfigured } from '@/lib/engagement/db';
import { getSeasonLeaderboard } from '@/lib/engagement/service';

export async function GET() {
  if (!isEngagementConfigured()) {
    return NextResponse.json({ leaderboard: null });
  }

  try {
    const user = await getUserSession();
    const leaderboard = await getSeasonLeaderboard(user?.id ?? null);
    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Failed to load points leaderboard:', error);
    return NextResponse.json({ leaderboard: null });
  }
}
