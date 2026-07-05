import { NextRequest, NextResponse } from 'next/server';
import { isEngagementConfigured } from '@/lib/engagement/db';
import { processPendingWipePrizes } from '@/lib/engagement/wipe-prizes';
import { safeCompare } from '@/lib/security';

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

  if (!isEngagementConfigured()) {
    return NextResponse.json({ ok: true, skipped: 'not configured' });
  }

  const result = await processPendingWipePrizes(new Date());
  return NextResponse.json({ ok: true, ...result });
}
