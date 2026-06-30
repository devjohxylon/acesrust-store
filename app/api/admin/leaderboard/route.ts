import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-auth';
import { getLeaderboard, saveLeaderboard } from '@/lib/cms-service';
import type { LeaderboardUpdateInput } from '@/lib/cms-types';

export async function GET() {
  try {
    await requireAdminSession();
    const data = await getLeaderboard();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdminSession();
    const body = (await request.json()) as LeaderboardUpdateInput;

    if (!body.serverName?.trim()) {
      return NextResponse.json({ error: 'Server name is required' }, { status: 400 });
    }

    await saveLeaderboard(body);
    const data = await getLeaderboard();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to save leaderboard' }, { status: 500 });
  }
}
