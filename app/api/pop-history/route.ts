import { NextRequest, NextResponse } from 'next/server';
import { getPopHistory } from '@/lib/cms-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const hours = Math.min(168, Math.max(1, Number(request.nextUrl.searchParams.get('hours')) || 24));

  try {
    const points = await getPopHistory(hours);
    return NextResponse.json(
      { points, hours },
      { headers: { 'Cache-Control': 'public, max-age=60' } }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to load pop history' }, { status: 500 });
  }
}
