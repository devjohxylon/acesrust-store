import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/engagement/session';
import { isEngagementConfigured } from '@/lib/engagement/db';
import {
  getAchievementsState,
  getProfile,
  getRecentTransactions,
  upsertProfile,
} from '@/lib/engagement/service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ discordId: string }> }
) {
  if (!isEngagementConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const { discordId } = await params;
  const user = await getUserSession();
  const isOwner = user?.id === discordId;

  let profile = await getProfile(discordId);
  if (!profile && isOwner && user) {
    try {
      profile = await upsertProfile(user);
    } catch (error) {
      console.error('Failed to create profile on demand:', error);
    }
  }
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const [achievements, transactions] = await Promise.all([
    getAchievementsState(discordId),
    isOwner ? getRecentTransactions(discordId) : Promise.resolve([]),
  ]);

  // lifetime_spend stays private to the owner.
  const publicProfile = isOwner ? profile : { ...profile, lifetime_spend: 0 };

  return NextResponse.json({
    profile: publicProfile,
    achievements,
    transactions,
    isOwner,
  });
}
