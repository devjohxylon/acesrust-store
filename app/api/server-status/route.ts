import { NextResponse } from 'next/server';
import { getServerStatus } from '@/lib/cms-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const server = await getServerStatus();
    return NextResponse.json(server, {
      headers: { 'Cache-Control': 'public, max-age=15' },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load server status' }, { status: 500 });
  }
}
