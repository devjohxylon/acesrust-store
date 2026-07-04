import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/engagement/session';
import { isEngagementConfigured } from '@/lib/engagement/db';
import { ACHIEVEMENTS } from '@/lib/engagement/achievements';
import { getAchievementsState } from '@/lib/engagement/service';

export async function GET() {
  if (!isEngagementConfigured()) {
    return NextResponse.json({
      achievements: ACHIEVEMENTS.map((a) => ({
        ...a,
        unlocked: false,
        unlockedAt: null,
        rarity: 0,
      })),
    });
  }

  try {
    const user = await getUserSession();
    const achievements = await getAchievementsState(user?.id ?? null);
    return NextResponse.json({ achievements });
  } catch (error) {
    console.error('Failed to load achievements:', error);
    return NextResponse.json({ error: 'Failed to load achievements' }, { status: 500 });
  }
}
