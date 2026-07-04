import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/engagement/session';
import { isEngagementConfigured } from '@/lib/engagement/db';
import { getActiveChallenges } from '@/lib/engagement/service';

export async function GET() {
  if (!isEngagementConfigured()) {
    return NextResponse.json({ challenges: [] });
  }

  try {
    const user = await getUserSession();
    const challenges = await getActiveChallenges(user?.id ?? null);
    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('Failed to load challenges:', error);
    return NextResponse.json({ challenges: [] });
  }
}
