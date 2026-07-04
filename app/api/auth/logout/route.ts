import { NextResponse } from 'next/server';
import { clearUserSession } from '@/lib/engagement/session';

export async function POST() {
  await clearUserSession();
  return NextResponse.json({ ok: true });
}
