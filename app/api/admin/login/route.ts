import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuthMode } from '@/lib/cms-config';
import { setAdminSession, verifyAdminPassword } from '@/lib/password-auth';

export async function POST(request: NextRequest) {
  if (getAdminAuthMode() !== 'password') {
    return NextResponse.json(
      { error: 'Admin login is not configured. Set ADMIN_PASSWORD.' },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { password?: string };
  if (!body.password || !verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}
