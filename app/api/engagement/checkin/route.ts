import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/engagement/session';
import { isEngagementConfigured } from '@/lib/engagement/db';
import { performCheckin } from '@/lib/engagement/service';
import { clientIp, rateLimit } from '@/lib/security';

export async function POST(request: NextRequest) {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isEngagementConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const limited = rateLimit(`checkin:${clientIp(request)}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const outcome = await performCheckin(user);
    return NextResponse.json(outcome);
  } catch (error) {
    console.error('Check-in failed:', error);
    return NextResponse.json({ error: 'Check-in failed' }, { status: 500 });
  }
}
