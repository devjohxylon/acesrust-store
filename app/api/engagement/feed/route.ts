import { NextResponse } from 'next/server';
import { isEngagementConfigured } from '@/lib/engagement/db';
import { getFeed } from '@/lib/engagement/service';

export const revalidate = 30;

export async function GET() {
  if (!isEngagementConfigured()) {
    return NextResponse.json({ events: [] });
  }

  try {
    const events = await getFeed(30);
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Failed to load feed:', error);
    return NextResponse.json({ events: [] });
  }
}
