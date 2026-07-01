import { NextResponse } from 'next/server';
import { getPopHistory } from '@/lib/cms-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const points = await getPopHistory(24);
    return NextResponse.json(
      { points },
      { headers: { 'Cache-Control': 'public, max-age=60' } }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to load pop history' }, { status: 500 });
  }
}
