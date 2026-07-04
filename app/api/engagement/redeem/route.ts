import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/engagement/session';
import { isEngagementConfigured } from '@/lib/engagement/db';
import { redeemReward } from '@/lib/engagement/service';
import { clientIp, rateLimit } from '@/lib/security';

export async function POST(request: NextRequest) {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isEngagementConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const limited = rateLimit(`redeem:${clientIp(request)}`, 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: { rewardId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.rewardId !== 'string') {
    return NextResponse.json({ error: 'Missing rewardId' }, { status: 400 });
  }

  try {
    const result = await redeemReward(user, body.rewardId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ redemption: result.redemption });
  } catch (error) {
    console.error('Redemption failed:', error);
    return NextResponse.json({ error: 'Redemption failed' }, { status: 500 });
  }
}
