import { NextResponse } from 'next/server';
import { getPublishedWipes } from '@/lib/cms-service';

export async function GET() {
  try {
    const wipes = await getPublishedWipes();
    return NextResponse.json({ wipes });
  } catch {
    return NextResponse.json({ error: 'Failed to load wipe schedule' }, { status: 500 });
  }
}
