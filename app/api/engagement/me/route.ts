import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/engagement/session';
import { isEngagementConfigured } from '@/lib/engagement/db';
import { getProfile, upsertProfile, updateProfileSettings } from '@/lib/engagement/service';

export async function GET() {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  if (!isEngagementConfigured()) {
    return NextResponse.json({ user, profile: null });
  }

  try {
    const profile = (await getProfile(user.id)) ?? (await upsertProfile(user));
    return NextResponse.json({ user, profile });
  } catch (error) {
    console.error('Failed to load profile:', error);
    return NextResponse.json({ user, profile: null });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isEngagementConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const settings: { game_name?: string | null; show_activity?: boolean; dm_reminders?: boolean } =
    {};
  if ('game_name' in body) {
    const name = body.game_name;
    if (name !== null && typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid game name' }, { status: 400 });
    }
    settings.game_name = typeof name === 'string' ? name.trim().slice(0, 64) || null : null;
  }
  if ('show_activity' in body) {
    settings.show_activity = Boolean(body.show_activity);
  }
  if ('dm_reminders' in body) {
    settings.dm_reminders = Boolean(body.dm_reminders);
  }

  await updateProfileSettings(user.id, settings);
  return NextResponse.json({ ok: true });
}
