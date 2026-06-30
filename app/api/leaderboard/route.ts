import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/cms-service';

export async function GET() {
  try {
    const data = await getLeaderboard();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 });
  }
}
